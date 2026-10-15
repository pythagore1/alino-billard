import crypto from "node:crypto";

/**
 * Logique pure de vérification de signature (extraite pour rester testable
 * sans le garde "server-only" ni dépendre de process.env — voir
 * notchpay-webhook.ts pour le point d'entrée réel côté application).
 * HMAC-SHA256 sur le corps brut, comparaison en temps constant.
 * https://developer.notchpay.co/get-started/webhooks/verify
 */
export function isValidNotchPaySignature(
  rawBody: string,
  signatureHeader: string | null,
  hash: string,
): boolean {
  if (!signatureHeader || !hash) return false;

  const expected = crypto.createHmac("sha256", hash).update(rawBody).digest("hex");

  const signatureBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
