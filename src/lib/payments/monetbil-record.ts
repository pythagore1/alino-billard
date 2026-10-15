import "server-only";
import { db } from "@/lib/db";
import { isValidMonetbilSign } from "./monetbil-signature";
import type { MonetbilStoredData } from "./monetbil";

export type MonetbilCallbackResult =
  | { status: "invalid_signature" }
  | { status: "unknown_payment" }
  | { status: "ok"; orderNumber: string };

/**
 * Enregistre ce que Monetbil nous communique (notification serveur OU retour du
 * client avec ses paramètres) : après contrôle de la signature, on retrouve le
 * paiement grâce à `payment_ref` (notre référence) et on y mémorise le
 * `transaction_id` de Monetbil, indispensable pour ensuite interroger
 * checkPayment. Ne confirme RIEN lui-même : la confirmation reste
 * confirmOrderPayment, qui revérifie directement chez Monetbil.
 */
export async function recordMonetbilCallback(fields: Record<string, string>): Promise<MonetbilCallbackResult> {
  const secret = process.env.MONETBIL_SERVICE_SECRET;
  if (!secret) {
    console.error("MONETBIL_SERVICE_SECRET manquant : impossible de vérifier la signature Monetbil.");
    return { status: "invalid_signature" };
  }
  if (!isValidMonetbilSign(fields, secret)) return { status: "invalid_signature" };

  const paymentRef = fields.payment_ref;
  const transactionId = fields.transaction_id;
  if (!paymentRef || !transactionId) return { status: "unknown_payment" };

  const payment = await db.payment.findUnique({
    where: { providerReference: paymentRef },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!payment || payment.provider !== "MONETBIL") return { status: "unknown_payment" };

  const stored: MonetbilStoredData = {
    transactionId,
    amount: Number(fields.amount) || undefined,
  };
  const previous = (payment.rawPayload ?? {}) as Record<string, unknown>;
  await db.payment.update({
    where: { id: payment.id },
    data: { rawPayload: { ...previous, monetbil: stored } as object },
  });

  return { status: "ok", orderNumber: payment.order.orderNumber };
}
