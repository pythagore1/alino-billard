import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { passwordFingerprint } from "@/lib/auth/fingerprint";
import { auth } from "@/lib/auth/config";
import type { Role } from "@/generated/prisma/enums";

/**
 * Vérifie le rôle de l'utilisateur connecté directement dans la Server Action
 * ou la page appelante — indépendamment du Proxy (src/proxy.ts). Le Proxy
 * protège la navigation ; ce garde protège l'action elle-même, y compris si
 * un jour une route change de chemin et échappe au matcher du Proxy.
 */
/**
 * Le jeton de session (JWT) est valable des jours : sans relecture, un compte
 * désactivé, rétrogradé ou dont le mot de passe vient d'être réinitialisé
 * garderait son accès. On relit donc l'état réel du compte (une fois par
 * requête) et on le compare à l'empreinte du mot de passe notée à la connexion.
 */
const loadAccountState = cache(async (userId: string) =>
  db.user.findUnique({
    where: { id: userId },
    select: { isActive: true, role: true, mustChangePassword: true, passwordHash: true },
  }),
);

async function getVerifiedSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const account = await loadAccountState(session.user.id);
  if (!account || !account.isActive) return null;
  if (session.user.pwf !== passwordFingerprint(account.passwordHash)) return null;
  return { session, account };
}

export async function requireRole(allowedRoles: Role[]) {
  const verified = await getVerifiedSession();
  // Le rôle fait foi depuis la base, pas depuis le jeton.
  const role = verified?.account.role;

  if (!verified || !role || !allowedRoles.includes(role)) {
    redirect("/compte/connexion");
  }
  // Mot de passe temporaire défini par un admin : à remplacer avant tout usage.
  if (verified.account.mustChangePassword) {
    redirect("/compte/nouveau-mot-de-passe");
  }

  return verified.session;
}

export async function requireAdmin() {
  return requireRole(["ADMIN", "SUPER_ADMIN"]);
}

export async function getCurrentUser() {
  const verified = await getVerifiedSession();
  if (!verified) return null;
  return { ...verified.session.user, role: verified.account.role };
}
