"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";

export async function listPaymentsForAdmin() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  return db.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true, sequenceNumber: true, guestName: true } } },
  });
}
