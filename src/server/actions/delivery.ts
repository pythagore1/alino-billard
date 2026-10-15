"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { deliveryZoneSchema, shippingRateSchema } from "@/lib/validation/delivery";
import { actionError, actionSuccess, BusinessError, type ActionResult } from "@/lib/errors";

const CAN_MANAGE_DELIVERY = ["ADMIN", "SUPER_ADMIN"] as const;

export async function listZonesForAdmin() {
  await requireRole([...CAN_MANAGE_DELIVERY]);
  return db.deliveryZone.findMany({
    orderBy: { name: "asc" },
    include: { rates: true, _count: { select: { orders: true } } },
  });
}

export async function createZone(name: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_DELIVERY]);

  const parsed = deliveryZoneSchema.safeParse({ name });
  if (!parsed.success) return actionError("Nom de zone invalide.");

  const zone = await db.deliveryZone.create({ data: parsed.data });

  await logAudit({
    userId: session.user.id,
    action: "deliveryZone.create",
    entityType: "DeliveryZone",
    entityId: zone.id,
  });

  revalidatePath("/admin/livraison");
  return actionSuccess({ id: zone.id });
}

export async function toggleZoneActive(id: string): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_DELIVERY]);
  const existing = await db.deliveryZone.findUnique({ where: { id } });
  if (!existing) return actionError("Zone introuvable.");

  await db.deliveryZone.update({ where: { id }, data: { isActive: !existing.isActive } });

  await logAudit({
    userId: session.user.id,
    action: "deliveryZone.toggle",
    entityType: "DeliveryZone",
    entityId: id,
  });

  revalidatePath("/admin/livraison");
  return actionSuccess(null);
}

export async function deleteZone(id: string): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_DELIVERY]);

  const existing = await db.deliveryZone.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) return actionError("Zone introuvable.");

  try {
    if (existing._count.orders > 0) {
      throw new BusinessError(
        "Impossible de supprimer une zone déjà utilisée par des commandes. Désactive-la plutôt.",
      );
    }
    await db.deliveryZone.delete({ where: { id } });
  } catch (error) {
    if (error instanceof BusinessError) return actionError(error.message);
    throw error;
  }

  await logAudit({
    userId: session.user.id,
    action: "deliveryZone.delete",
    entityType: "DeliveryZone",
    entityId: id,
  });

  revalidatePath("/admin/livraison");
  return actionSuccess(null);
}

export async function addShippingRate(input: {
  zoneId: string;
  method: "STANDARD" | "EXPRESS";
  price: number;
  freeAbove?: number;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_DELIVERY]);

  const parsed = shippingRateSchema.safeParse(input);
  if (!parsed.success) return actionError("Tarif invalide.");

  const existing = await db.shippingRate.findFirst({
    where: { zoneId: parsed.data.zoneId, method: parsed.data.method },
  });
  if (existing) {
    return actionError("Un tarif existe déjà pour cette zone et ce mode de livraison.");
  }

  const rate = await db.shippingRate.create({ data: parsed.data });

  await logAudit({
    userId: session.user.id,
    action: "shippingRate.create",
    entityType: "ShippingRate",
    entityId: rate.id,
  });

  revalidatePath("/admin/livraison");
  return actionSuccess({ id: rate.id });
}

export async function deleteShippingRate(id: string): Promise<ActionResult<null>> {
  await requireRole([...CAN_MANAGE_DELIVERY]);
  await db.shippingRate.delete({ where: { id } });
  revalidatePath("/admin/livraison");
  return actionSuccess(null);
}
