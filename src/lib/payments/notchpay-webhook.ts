import "server-only";
import { isValidNotchPaySignature } from "./notchpay-signature";

/**
 * Vérifie la signature d'un webhook NotchPay entrant (header
 * `x-notch-signature`) en lisant le hash secret depuis l'environnement.
 * Voir notchpay-signature.ts pour la logique pure testée unitairement.
 */
export function verifyNotchPaySignature(rawBody: string, signatureHeader: string | null): boolean {
  const hash = process.env.NOTCHPAY_WEBHOOK_HASH;
  if (!hash) {
    console.error("NOTCHPAY_WEBHOOK_HASH manquant : impossible de vérifier le webhook.");
    return false;
  }
  return isValidNotchPaySignature(rawBody, signatureHeader, hash);
}
