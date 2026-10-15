"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { notifyRole, notifyUser } from "@/lib/notifications";
import { DELIVERY_STATUS_LABELS } from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";
import { canReassignDelivery, isValidDeliveryStatusTransition } from "@/lib/delivery-status";
import type { DeliveryStatus } from "@/generated/prisma/enums";

const CAN_MANAGE_ORDERS = ["ADMIN", "SUPER_ADMIN"] as const;

// Statuts considérés comme "en cours" pour la charge de travail affichée à
// l'admin lors de l'assignation — une livraison DELIVERED/FAILED ne compte
// plus contre le livreur.
const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export async function getDeliveryPersons() {
  await requireRole([...CAN_MANAGE_ORDERS]);
  const persons = await db.user.findMany({
    where: { role: "DELIVERY", isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: {
        select: { deliveries: { where: { status: { in: ACTIVE_DELIVERY_STATUSES } } } },
      },
    },
  });

  return persons.map((p) => ({ id: p.id, name: p.name, activeDeliveryCount: p._count.deliveries }));
}

/** Assigne (ou réassigne) un livreur à une commande — crée la livraison si besoin. */
export async function assignDelivery(
  orderId: string,
  userId: string,
): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_ORDERS]);

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return actionError("Commande introuvable.");

  const existing = await db.delivery.findUnique({ where: { orderId } });
  if (!canReassignDelivery(existing?.status ?? null)) {
    return actionError(
      "Impossible de changer de livreur : celui-ci a déjà pris en charge cette livraison.",
    );
  }

  await db.delivery.upsert({
    where: { orderId },
    update: { assignedToId: userId, status: "ASSIGNED" },
    create: { orderId, assignedToId: userId, status: "ASSIGNED" },
  });

  await logAudit({
    userId: session.user.id,
    action: "delivery.assign",
    entityType: "Order",
    entityId: orderId,
    after: { assignedToId: userId },
  });

  await notifyUser(userId, {
    title: "Nouvelle livraison assignée",
    body: `${formatOrderReference(order.sequenceNumber)} — ${order.address}, ${order.city} (${order.region})`,
    url: "/admin/mes-livraisons",
  });

  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/admin/mes-livraisons");
  return actionSuccess(null);
}

/** Vue livreur : uniquement les livraisons qui lui sont assignées. */
export type MyDeliveriesSort = "newest" | "oldest";

export type MyDeliveriesFilters = {
  status?: DeliveryStatus;
  sort?: MyDeliveriesSort;
};

export async function getMyDeliveries(filters: MyDeliveriesFilters = {}) {
  const session = await requireRole(["DELIVERY", "ADMIN", "SUPER_ADMIN"]);

  return db.delivery.findMany({
    where: {
      assignedToId: session.user.id,
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
    include: {
      order: { include: { items: true } },
    },
  });
}

/**
 * Mise à jour du statut de livraison — accessible au livreur assigné et aux
 * admins. Ne peut avancer que dans le sens de la progression (jamais revenir
 * en arrière, jamais reprendre une livraison déjà terminée) : voir
 * src/lib/delivery-status.ts pour la règle exacte, appliquée ici et non
 * seulement dans l'interface, pour ne pas dépendre d'un client honnête.
 * Marquer "DELIVERED" fait aussi avancer la commande (statut, et paiement si
 * c'était un paiement à la livraison en espèces).
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
): Promise<ActionResult<null>> {
  const session = await requireRole(["DELIVERY", "ADMIN", "SUPER_ADMIN"]);

  const delivery = await db.delivery.findUnique({ where: { id: deliveryId }, include: { order: true } });
  if (!delivery) return actionError("Livraison introuvable.");

  const isOwnDelivery = delivery.assignedToId === session.user.id;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isOwnDelivery && !isAdmin) {
    return actionError("Cette livraison ne t'est pas assignée.");
  }

  if (!isValidDeliveryStatusTransition(delivery.status, status)) {
    return actionError("Ce changement de statut n'est pas autorisé (la livraison ne peut qu'avancer).");
  }

  await db.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: { status, deliveredAt: status === "DELIVERED" ? new Date() : undefined },
    });

    if (status === "DELIVERED") {
      const order = delivery.order;
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "DELIVERED",
          // Le paiement à la livraison est encaissé par le livreur au moment
          // de la remise du colis : on le marque payé automatiquement.
          paymentStatus: order.paymentMethod === "CASH_ON_DELIVERY" ? "PAID" : order.paymentStatus,
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, fromStatus: order.orderStatus, toStatus: "DELIVERED", changedBy: session.user.id },
      });
    }
  });

  await logAudit({
    userId: session.user.id,
    action: "delivery.statusChange",
    entityType: "Delivery",
    entityId: deliveryId,
    after: { status },
  });

  if (status === "DELIVERED" || status === "FAILED") {
    const notifyPayload = {
      title: status === "DELIVERED" ? "Livraison terminée" : "Échec de livraison",
      body: `${delivery.order.orderNumber} — ${DELIVERY_STATUS_LABELS[status]}`,
      url: `/admin/commandes/${delivery.orderId}`,
    };
    await Promise.all([notifyRole("ADMIN", notifyPayload), notifyRole("SUPER_ADMIN", notifyPayload)]);

    if (delivery.order.customerId) {
      await notifyUser(delivery.order.customerId, {
        title: status === "DELIVERED" ? "Commande livrée" : "Problème de livraison",
        body: `${delivery.order.orderNumber} — ${DELIVERY_STATUS_LABELS[status]}`,
        url: `/commande/confirmation/${delivery.order.orderNumber}`,
      });
    }
  }

  revalidatePath("/admin/mes-livraisons");
  revalidatePath(`/admin/commandes/${delivery.orderId}`);
  return actionSuccess(null);
}
