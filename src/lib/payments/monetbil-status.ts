import type { VerifyPaymentResult } from "./provider";

/**
 * Pure : traduit le statut renvoyé par Monetbil (checkPayment) en statut interne.
 * Codes d'après leur bibliothèque officielle :
 *   mode réel : 1 = payé, 0 = échec, -1 = annulé
 *   mode test : 7 = payé (test), 8 = échec (test), 9 = annulé (test)
 *
 * Un « payé » en mode TEST n'est accepté que si allowTestMode est vrai
 * (variable MONETBIL_TEST_MODE) : sans cela, un paiement fictif ne doit jamais
 * marquer une vraie commande comme payée. Valeur inconnue -> PENDING.
 */
export function mapMonetbilStatus(status: unknown, allowTestMode: boolean): VerifyPaymentResult["status"] {
  // Number(null), Number("") et Number(" ") valent 0 : un statut absent ou vide
  // serait pris pour un échec. On n'accepte qu'un nombre ou une chaîne numérique.
  const isNumeric =
    typeof status === "number" || (typeof status === "string" && status.trim() !== "");
  if (!isNumeric) return "PENDING";
  const code = Number(status);
  if (!Number.isFinite(code)) return "PENDING";

  if (code === 1) return "SUCCESS";
  if (code === 7) return allowTestMode ? "SUCCESS" : "PENDING";
  if (code === 0 || code === 8) return "FAILED";
  if (code === -1 || code === 9) return "CANCELLED";
  return "PENDING";
}
