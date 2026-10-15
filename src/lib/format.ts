/** Formatage FCFA cohérent partout (admin + boutique) : entiers, séparateur d'espace. */
export function formatPrice(value: number): string {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}
