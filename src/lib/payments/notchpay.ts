import "server-only";
import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProvider, VerifyPaymentResult } from "./provider";
import { mapNotchPayStatus } from "./notchpay-status";

const NOTCHPAY_API_BASE = "https://api.notchpay.co";

/**
 * Intégration NotchPay (MTN Mobile Money + Orange Money), d'après la
 * documentation officielle : https://developer.notchpay.co
 *
 * Flux retenu : paiement hébergé (POST /payments -> authorization_url), le
 * client est redirigé vers la page sécurisée NotchPay pour saisir son code
 * Mobile Money — Alino Billard & Accessoires ne manipule jamais de code PIN. Le paiement
 * n'est confirmé QUE côté serveur : vérification directe (GET /payments) au
 * retour du client ET webhook signé (jamais le frontend seul), conformément
 * au cahier des charges section 11.
 *
 * D'après la doc d'authentification NotchPay, la clé PUBLIQUE suffit pour
 * l'initialisation/consultation d'un paiement (le header X-Grant + clé
 * privée n'est nécessaire que pour les opérations sensibles type virements).
 */
class NotchPayProvider implements PaymentProvider {
  readonly type = "NOTCHPAY" as const;

  private get publicKey(): string {
    const key = process.env.NOTCHPAY_PUBLIC_KEY;
    if (!key) throw new Error("NOTCHPAY_PUBLIC_KEY manquant.");
    return key;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const response = await fetch(`${NOTCHPAY_API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: this.publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        phone: input.customerPhone,
        description: `Commande ${input.orderNumber} — Alino Billard & Accessoires`,
        reference: input.orderNumber,
        callback: `${process.env.NEXT_PUBLIC_SITE_URL}/commande/confirmation/${input.orderNumber}`,
        ...(input.channel ? { locked_channel: input.channel } : {}),
      }),
    });

    const raw = await response.json();
    if (!response.ok || !raw.transaction) {
      throw new Error(raw.message || "Échec de l'initialisation du paiement NotchPay.");
    }

    // Vérifié avec un vrai appel sandbox : `transaction` est un objet complet
    // dont `reference` (ex: "trx.test_...") est la référence NotchPay à
    // utiliser pour GET /payments/{reference} — notre propre numéro de
    // commande apparaît séparément dans `transaction.merchant_reference`.
    return {
      providerReference: raw.transaction.reference,
      redirectUrl: raw.authorization_url,
      raw,
    };
  }

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    const response = await fetch(`${NOTCHPAY_API_BASE}/payments/${providerReference}`, {
      headers: { Authorization: this.publicKey },
    });

    const raw = await response.json();
    if (!response.ok) {
      throw new Error(raw.message || "Échec de la vérification du paiement NotchPay.");
    }

    return {
      providerReference,
      status: mapNotchPayStatus(raw),
      amount: raw.transaction?.amount ?? raw.amount ?? 0,
      raw,
    };
  }
}

export const notchPayProvider = new NotchPayProvider();

/** Événements webhook NotchPay pertinents pour nous (voir doc "Webhooks"). */
export type NotchPayWebhookEventType =
  | "payment.created"
  | "payment.complete"
  | "payment.failed"
  | "payment.canceled"
  | "payment.expired";

// `data` a la même forme que l'objet transaction retourné par l'API (voir
// mapNotchPayStatus ci-dessus) : `reference` est la référence NotchPay,
// `merchant_reference` est notre propre numéro de commande.
export interface NotchPayWebhookEvent {
  type: NotchPayWebhookEventType;
  data: { reference?: string; merchant_reference?: string; status?: string; [key: string]: unknown };
}
