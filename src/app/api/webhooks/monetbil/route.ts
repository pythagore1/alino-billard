import { NextResponse } from "next/server";
import { recordMonetbilCallback } from "@/lib/payments/monetbil-record";
import { confirmOrderPayment } from "@/lib/payments/confirm";

/**
 * Notification Monetbil (POST formulaire : transaction_id, payment_ref, item_ref,
 * amount, status, sign...). La signature MD5 (`sign`) est exigée : une
 * notification non signée correctement est rejetée en 403, comme dans leur
 * exemple officiel. Elle ne sert qu'à identifier le paiement et à mémoriser le
 * transaction_id : le statut réel est ensuite relu directement chez Monetbil
 * (checkPayment) par confirmOrderPayment, jamais lu dans la notification.
 */
export async function POST(request: Request) {
  let fields: Record<string, string> = {};
  try {
    const form = await request.formData();
    fields = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  const result = await recordMonetbilCallback(fields);

  if (result.status === "invalid_signature") {
    console.error("Webhook Monetbil : signature invalide, requête rejetée.");
    return new NextResponse("Error: Invalid signature", { status: 403 });
  }
  if (result.status === "unknown_payment") {
    // Réponse 200 : ne rien révéler sur les paiements existants.
    return new NextResponse("received");
  }

  try {
    await confirmOrderPayment(result.orderNumber);
  } catch (error) {
    console.error("Webhook Monetbil : échec du traitement.", error);
    // 500 plutôt que 200 : on laisse Monetbil retenter (erreur possiblement transitoire).
    return NextResponse.json({ error: "Traitement échoué" }, { status: 500 });
  }

  return new NextResponse("received");
}
