"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { staffUserSchema, type StaffUserInput } from "@/lib/validation/user";
import { passwordSchema } from "@/lib/validation/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

// Seul un SUPER_ADMIN gère les comptes internes (admin/livreur) — un simple
// ADMIN ne doit pas pouvoir se créer un accès SUPER_ADMIN ou désactiver
// d'autres comptes (cf. matrice de permissions du plan d'architecture).
const CAN_MANAGE_STAFF = ["SUPER_ADMIN"] as const;

export async function listStaffUsers() {
  await requireRole([...CAN_MANAGE_STAFF]);
  return db.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN", "DELIVERY"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
}

export async function createStaffUser(
  input: StaffUserInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_STAFF]);

  const parsed = staffUserSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return actionError("Un compte existe déjà avec cet email.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "staffUser.create",
    entityType: "User",
    entityId: user.id,
    after: { email: user.email, role: user.role },
  });

  revalidatePath("/admin/utilisateurs");
  return actionSuccess({ id: user.id });
}

/**
 * Réinitialise le mot de passe d'un compte interne — utile pour changer les
 * mots de passe de démo avant la mise en production, sans passer par la base
 * de données à la main. Le SUPER_ADMIN peut aussi réinitialiser le sien.
 */
export async function resetStaffUserPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_STAFF]);

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) return actionError("Compte introuvable.");

  const passwordHash = await bcrypt.hash(parsed.data, 12);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "staffUser.resetPassword",
    entityType: "User",
    entityId: userId,
  });

  return actionSuccess(null);
}

export async function toggleStaffUserActive(userId: string): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_STAFF]);

  if (userId === session.user.id) {
    return actionError("Tu ne peux pas désactiver ton propre compte.");
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) return actionError("Compte introuvable.");

  await db.user.update({ where: { id: userId }, data: { isActive: !existing.isActive } });

  await logAudit({
    userId: session.user.id,
    action: existing.isActive ? "staffUser.deactivate" : "staffUser.activate",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/utilisateurs");
  return actionSuccess(null);
}
