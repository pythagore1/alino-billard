import type { PaymentProviderType } from "@/generated/prisma/enums";

export interface InitiatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerPhone: string;
  customerName: string;
  /** Verrouille le canal Mobile Money sur la page de paiement hébergée (ex: "cm.mtn" / "cm.orange"). */
  channel?: string;
}

export interface InitiatePaymentResult {
  providerReference: string;
  redirectUrl?: string;
  raw: unknown;
}

export interface VerifyPaymentResult {
  providerReference: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  raw: unknown;
}

/**
 * Contrat commun à tous les moyens de paiement (Mobile Money, espèces...).
 * Permet de changer/ajouter un fournisseur sans modifier le reste de l'application
 * (commandes, webhooks, admin) — cf. cahier des charges section 11.
 */
export interface PaymentProvider {
  readonly type: PaymentProviderType;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /**
   * `payment` : le paiement tel qu'enregistré chez nous (certains fournisseurs,
   * comme Monetbil, ont besoin d'un identifiant reçu après le début du paiement).
   */
  verifyPayment(providerReference: string, payment?: { rawPayload: unknown }): Promise<VerifyPaymentResult>;
}
