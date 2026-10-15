import type { VerifyPaymentResult } from "./provider";

/**
 * Pure function extraite de notchpay.ts pour rester testable sans le garde
 * "server-only" (qui empêche toute exécution hors runtime Next.js RSC).
 * Confirmé par un appel réel en sandbox : GET /payments/{reference} renvoie
 * `transaction.status` (valeurs observées : "pending", "processing",
 * "complete"). On ne renvoie JAMAIS "SUCCESS" par défaut si la valeur est
 * inattendue — en cas de doute, le paiement reste "PENDING" (jamais de faux
 * positif de paiement réussi).
 */
export function mapNotchPayStatus(raw: unknown): VerifyPaymentResult["status"] {
  const status = (raw as { transaction?: { status?: string } })?.transaction?.status ?? "";

  const normalized = String(status).toLowerCase();
  if (normalized === "complete" || normalized === "completed" || normalized === "success") {
    return "SUCCESS";
  }
  if (normalized === "failed") return "FAILED";
  if (normalized === "canceled" || normalized === "cancelled" || normalized === "expired") {
    return "CANCELLED";
  }
  return "PENDING";
}
