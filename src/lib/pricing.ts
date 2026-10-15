export type PriceTier = { minQuantity: number; unitPrice: number };

/**
 * Prix unitaire applicable pour une quantité donnée : le palier dont
 * `minQuantity` est le plus élevé tout en restant <= quantity, sinon le prix
 * de base (1 unité). Utilisé aussi bien côté panier/commande (serveur) que
 * dans l'affichage optimiste du panier (client) — d'où l'absence de
 * dépendance serveur ici.
 */
export function getUnitPrice(basePrice: number, tiers: PriceTier[], quantity: number): number {
  const applicable = tiers
    .filter((tier) => quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  return applicable ? applicable.unitPrice : basePrice;
}

export function getLineTotal(basePrice: number, tiers: PriceTier[], quantity: number): number {
  return getUnitPrice(basePrice, tiers, quantity) * quantity;
}
