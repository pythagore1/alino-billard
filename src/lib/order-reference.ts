/**
 * Référence courte et lisible dérivée de `Order.sequenceNumber` — faite pour
 * être dite/tapée par un client (WhatsApp, téléphone), contrairement à
 * `orderNumber` (long, imprévisible, réservé aux URLs publiques).
 */
export function formatOrderReference(sequenceNumber: number): string {
  return `RB-${String(sequenceNumber).padStart(4, "0")}`;
}

/**
 * Récupère le numéro de séquence à partir d'une référence tapée par un
 * client — tolérant à la casse, aux espaces et au préfixe "RB" oublié.
 * Retourne `null` si rien d'exploitable n'a été saisi.
 */
export function parseOrderReference(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}
