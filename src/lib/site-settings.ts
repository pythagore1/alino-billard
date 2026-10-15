import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

/**
 * La boutique n'a qu'une seule ligne de paramètres. On la crée à la volée si
 * elle n'existe pas encore (ne devrait pas arriver après le seed, mais on ne
 * veut jamais planter l'admin faute de ligne de configuration).
 *
 * Mis en cache : lue sur presque toutes les pages (en-tête, pied de page,
 * WhatsApp...). Invalidée par updateSiteSettings() via le tag "settings".
 */
export async function getSiteSettings() {
  "use cache";
  cacheTag("settings");
  cacheLife("catalog");

  const existing = await db.siteSettings.findFirst();
  if (existing) return existing;
  return db.siteSettings.create({ data: {} });
}
