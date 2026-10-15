import type { Availability } from "@/generated/prisma/enums";

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: "Disponible",
  TO_CONFIRM: "Disponibilité à confirmer",
  ON_ORDER: "Sur commande",
  OUT_OF_STOCK: "Rupture de stock",
  DISABLED: "Indisponible",
};

// Badge produit : vert quand on peut commander sans friction, ambre pour les
// cas nécessitant une vérification, gris pour l'indisponibilité.
export const AVAILABILITY_BADGE_CLASS: Record<Availability, string> = {
  AVAILABLE: "bg-primary/10 text-primary",
  TO_CONFIRM: "bg-amber-100 text-amber-800",
  ON_ORDER: "bg-amber-100 text-amber-800",
  OUT_OF_STOCK: "bg-surface-muted text-muted-foreground",
  DISABLED: "bg-surface-muted text-muted-foreground",
};

/**
 * Un produit "à confirmer" ou "sur commande" reste commandable : c'est
 * justement le rôle du statut de commande CHECKING_AVAILABILITY de gérer la
 * vérification auprès du grossiste après coup. Seuls rupture de stock et
 * désactivé bloquent réellement la commande (cahier des charges section 8).
 */
export function isOrderable(availability: Availability): boolean {
  return availability !== "OUT_OF_STOCK" && availability !== "DISABLED";
}
