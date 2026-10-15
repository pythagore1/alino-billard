import type { Role } from "@/generated/prisma/enums";

/**
 * Destination après connexion selon le rôle — partagée entre `authenticate()`
 * et le changement de mot de passe obligatoire, pour ne pas dupliquer cette
 * logique à deux endroits.
 */
export function getPostLoginPath(role: Role | undefined): string {
  if (role === "DELIVERY") return "/admin/mes-livraisons";
  if (role && role !== "CUSTOMER") return "/admin";
  return "/";
}
