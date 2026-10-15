import "server-only";
import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProvider, VerifyPaymentResult } from "./provider";
import { mapMonetbilStatus } from "./monetbil-status";
import { newMonetbilPaymentRef } from "./monetbil-signature";

const MONETBIL_WIDGET_URL = "https://www.monetbil.com/widget/v2.1";
const MONETBIL_CHECK_PAYMENT_URL = "https://api.monetbil.com/payment/v1/checkPayment";

/** Ce que Monetbil nous communique (notification ou retour client) et que l'on conserve sur le paiement. */
export interface MonetbilStoredData {
  transactionId?: string;
  amount?: number;
}

function storedData(rawPayload: unknown): MonetbilStoredData {
  return ((rawPayload as { monetbil?: MonetbilStoredData } | null)?.monetbil ?? {}) as MonetbilStoredData;
}

/**
 * Intégration Monetbil (MTN Mobile Money + Orange Money), d'après leur
 * bibliothèque officielle monetbil-php (widget v2.1 + checkPayment).
 *
 * Même principe que les autres fournisseurs : paiement hébergé (le client est
 * redirigé vers la page Monetbil, il n'entre jamais son code chez nous), et
 * confirmation uniquement par une vérification serveur (checkPayment) — jamais
 * sur la seule foi du retour du client ni de la signature MD5 de la notification.
 */
class MonetbilProvider implements PaymentProvider {
  readonly type = "MONETBIL" as const;

  private get serviceKey(): string {
    const key = process.env.MONETBIL_SERVICE_KEY;
    if (!key) throw new Error("MONETBIL_SERVICE_KEY manquant.");
    return key;
  }

  private get allowTestMode(): boolean {
    return process.env.MONETBIL_TEST_MODE === "true";
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const paymentRef = newMonetbilPaymentRef(input.orderNumber);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const body = new URLSearchParams({
      amount: String(input.amount),
      currency: input.currency,
      locale: "fr",
      country: "CM",
      item_ref: input.orderNumber,
      payment_ref: paymentRef,
      first_name: input.customerName,
      return_url: `${siteUrl}/commande/confirmation/${input.orderNumber}`,
      notify_url: `${siteUrl}/api/webhooks/monetbil`,
    });

    const response = await fetch(`${MONETBIL_WIDGET_URL}/${this.serviceKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const raw = await response.json().catch(() => null);
    if (!response.ok || !raw?.payment_url) {
      throw new Error(raw?.message || "Échec de l'initialisation du paiement Monetbil.");
    }

    return { providerReference: paymentRef, redirectUrl: raw.payment_url, raw };
  }

  async verifyPayment(providerReference: string, payment?: { rawPayload: unknown }): Promise<VerifyPaymentResult> {
    const { transactionId, amount: notifiedAmount } = storedData(payment?.rawPayload);

    // checkPayment s'interroge avec le transaction_id de Monetbil, que nous ne
    // connaissons qu'une fois que Monetbil nous a notifié ou que le client est
    // revenu sur le site. Tant qu'on ne l'a pas : en attente.
    if (!transactionId) {
      return { providerReference, status: "PENDING", amount: 0, raw: { reason: "transaction_id_unknown" } };
    }

    const response = await fetch(MONETBIL_CHECK_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ paymentId: transactionId }),
    });

    const raw = await response.json().catch(() => null);
    const transaction = raw?.transaction;
    // Sans objet `transaction` dans la réponse, on ne conclut rien (le kit officiel
    // renvoie « 0 » dans ce cas, ce que nous ne traitons surtout pas comme un échec définitif).
    if (!transaction) {
      return { providerReference, status: "PENDING", amount: 0, raw };
    }

    // Montant : celui de la réponse si elle en contient un, sinon celui de la
    // notification signée par Monetbil (comparé ensuite à celui de la commande).
    const amount = Number(transaction.amount) || notifiedAmount || 0;

    return {
      providerReference,
      status: mapMonetbilStatus(transaction.status, this.allowTestMode),
      amount,
      raw,
    };
  }
}

export const monetbilProvider = new MonetbilProvider();
