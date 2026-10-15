"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { passwordSchema } from "@/lib/validation/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

// Les admins (pas seulement le SUPER_ADMIN) gèrent le support client au
// quotidien — cohérent avec la gestion des commandes, contrairement aux
// comptes internes (admin/livreur) réservés au SUPER_ADMIN.
const CAN_MANAGE_CUSTOMERS = ["ADMIN", "SUPER_ADMIN"] as const;

export async function listCustomersForAdmin(search?: string) {
  await requireRole([...CAN_MANAGE_CUSTOMERS]);

  return db.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}

/**
 * Réinitialisation assistée : le client contacte le support (WhatsApp) et un
 * admin lui définit un mot de passe temporaire à lui communiquer — en
 * attendant un vrai flux self-service (email ou WhatsApp, cf. décision prise
 * avec l'utilisateur de reporter ce chantier tant que Resend/Meta Business
 * ne sont pas configurés).
 */
export async function resetCustomerPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_CUSTOMERS]);

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing || existing.role !== "CUSTOMER") return actionError("Client introuvable.");

  const passwordHash = await bcrypt.hash(parsed.data, 12);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "customer.resetPassword",
    entityType: "User",
    entityId: userId,
  });

  return actionSuccess(null);
}
