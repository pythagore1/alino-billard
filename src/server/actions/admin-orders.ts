"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { parseOrderReference } from "@/lib/order-reference";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";
import type { OrderStatus, OrderPaymentStatus } from "@/generated/prisma/enums";

const CAN_MANAGE_ORDERS = ["ADMIN", "SUPER_ADMIN"] as const;

export async function listOrdersForAdmin(filters: { status?: OrderStatus; search?: string } = {}) {
  await requireRole([...CAN_MANAGE_ORDERS]);

  // La référence courte (RB-0142) est ce que le staff a en tête en parlant à
  // un client au téléphone — on la cherche en plus du numéro technique.
  const referenceNumber = filters.search ? parseOrderReference(filters.search) : null;

  return db.order.findMany({
    where: {
      ...(filters.status ? { orderStatus: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { orderNumber: { contains: filters.search, mode: "insensitive" } },
              { guestName: { contains: filters.search, mode: "insensitive" } },
              { guestPhone: { contains: filters.search, mode: "insensitive" } },
              ...(referenceNumber ? [{ sequenceNumber: referenceNumber }] : []),
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getOrderForAdmin(id: string) {
  await requireRole([...CAN_MANAGE_ORDERS]);
  return db.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: true,
      deliveryZone: true,
      delivery: { include: { assignedTo: { select: { id: true, name: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_ORDERS]);

  const existing = await db.order.findUnique({ where: { id: orderId } });
  if (!existing) return actionError("Commande introuvable.");

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { orderStatus: newStatus } }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: existing.orderStatus,
        toStatus: newStatus,
        changedBy: session.user.id,
      },
    }),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "order.statusChange",
    entityType: "Order",
    entityId: orderId,
    before: { orderStatus: existing.orderStatus },
    after: { orderStatus: newStatus },
  });

  if (existing.customerId) {
    await notifyUser(existing.customerId, {
      title: "Mise à jour de votre commande",
      body: `${existing.orderNumber} — ${ORDER_STATUS_LABELS[newStatus]}`,
      url: `/commande/confirmation/${existing.orderNumber}`,
    });
  }

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  return actionSuccess(null);
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: OrderPaymentStatus,
): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_ORDERS]);

  const existing = await db.order.findUnique({ where: { id: orderId } });
  if (!existing) return actionError("Commande introuvable.");

  await db.order.update({ where: { id: orderId }, data: { paymentStatus } });

  await logAudit({
    userId: session.user.id,
    action: "order.paymentStatusChange",
    entityType: "Order",
    entityId: orderId,
    before: { paymentStatus: existing.paymentStatus },
    after: { paymentStatus },
  });

  revalidatePath(`/admin/commandes/${orderId}`);
  return actionSuccess(null);
}
