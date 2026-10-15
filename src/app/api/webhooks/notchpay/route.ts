import { NextResponse } from "next/server";
import { verifyNotchPaySignature } from "@/lib/payments/notchpay-webhook";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import type { NotchPayWebhookEvent } from "@/lib/payments/notchpay";

const RELEVANT_EVENTS = new Set([
  "payment.complete",
  "payment.failed",
  "payment.canceled",
  "payment.expired",
]);

export async function POST(request: Request) {
  // Signature vérifiée sur le corps BRUT (pas sur un objet re-sérialisé,
  // qui pourrait différer octet pour octet de ce que NotchPay a signé).
  const rawBody = await request.text();
  const signature = request.headers.get("x-notch-signature");

  if (!verifyNotchPaySignature(rawBody, signature)) {
    console.error("Webhook NotchPay : signature invalide, requête rejetée.");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let event: NotchPayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Vérifié via un vrai appel API : l'objet transaction NotchPay porte notre
  // numéro de commande dans `merchant_reference` (sa propre référence interne
  // est dans `reference`, différente de la nôtre).
  const orderNumber = event.data?.merchant_reference;

  if (!orderNumber) {
    console.error("Webhook NotchPay : impossible d'identifier la commande.", event);
    return NextResponse.json({ error: "Référence de commande manquante" }, { status: 400 });
  }

  try {
    await confirmOrderPayment(orderNumber);
  } catch (error) {
    console.error("Webhook NotchPay : échec du traitement.", error);
    // 500 plutôt que 200 : on laisse NotchPay retenter (erreur possiblement
    // transitoire — DB, réseau...), plutôt que de masquer l'échec.
    return NextResponse.json({ error: "Traitement échoué" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
