import "server-only";
import type { PaymentProviderType } from "@/generated/prisma/enums";
import type { PaymentProvider } from "./provider";
import { notchPayProvider } from "./notchpay";
import { monetbilProvider } from "./monetbil";

/**
 * Fournisseur Mobile Money utilisé pour les NOUVEAUX paiements, choisi par la
 * variable d'environnement PAYMENT_PROVIDER ("notchpay" ou "monetbil",
 * par défaut notchpay). Changer de fournisseur ne touche ni les
 * commandes ni l'historique : chaque paiement garde le fournisseur avec lequel
 * il a été créé.
 */
function configuredName(): "notchpay" | "monetbil" {
  const name = process.env.PAYMENT_PROVIDER?.toLowerCase();
  return name === "monetbil" ? name : "notchpay";
}

export function getActiveMobileMoneyProvider(): PaymentProvider {
  const name = configuredName();
  if (name === "monetbil") return monetbilProvider;
  return notchPayProvider;
}

/** Les identifiants du fournisseur actif sont-ils présents ? */
export function isMobileMoneyConfigured(): boolean {
  const name = configuredName();
  if (name === "monetbil") return Boolean(process.env.MONETBIL_SERVICE_KEY && process.env.MONETBIL_SERVICE_SECRET);
  return Boolean(process.env.NOTCHPAY_PUBLIC_KEY);
}

/** Fournisseur d'un paiement déjà créé (pour le revérifier avec le bon service). */
export function getProviderForPayment(type: PaymentProviderType): PaymentProvider | null {
  if (type === "MONETBIL") return monetbilProvider;
  if (type === "NOTCHPAY") return notchPayProvider;
  return null;
}
