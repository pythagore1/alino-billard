import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/server/actions/orders";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { recordMonetbilCallback } from "@/lib/payments/monetbil-record";
import { formatPrice } from "@/lib/format";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";
import { primaryButtonClass } from "@/lib/ui";

export const metadata: Metadata = { title: "Commande confirmée" };

const NOTCHPAY_METHODS = new Set(["NOTCHPAY_MTN", "NOTCHPAY_ORANGE"]);

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { numero } = await params;
  const query = await searchParams;
  let order = await getOrderByNumber(numero);
  if (!order) notFound();

  // Retour du client depuis la page de paiement NotchPay : on revérifie tout
  // de suite pour un affichage à jour, sans attendre le webhook (qui reste
  // la source de vérité finale et gère les cas où le client ne revient pas).
  if (NOTCHPAY_METHODS.has(order.paymentMethod) && order.paymentStatus === "PENDING") {
    try {
      // Retour depuis Monetbil : la page reçoit transaction_id, payment_ref et sign.
      // Après contrôle de la signature, on mémorise le transaction_id (nécessaire à
      // la vérification) ; sans effet pour les autres fournisseurs.
      if (typeof query.transaction_id === "string" && typeof query.sign === "string") {
        const fields = Object.fromEntries(
          Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        );
        await recordMonetbilCallback(fields);
      }
      await confirmOrderPayment(order.orderNumber);
      order = await getOrderByNumber(numero);
    } catch (error) {
      console.error("Échec de la vérification du paiement à l'affichage", error);
    }
  }
  if (!order) notFound();

  const isPaymentPending = NOTCHPAY_METHODS.has(order.paymentMethod) && order.paymentStatus === "PENDING";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <p className="text-4xl">{isPaymentPending ? "⏳" : "✅"}</p>
        <h1 className="mt-3 text-2xl font-semibold">
          {isPaymentPending ? "Paiement en attente de confirmation" : "Commande enregistrée"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isPaymentPending
            ? "Nous attendons la confirmation de votre paiement Mobile Money. Cette page se mettra à jour automatiquement — vous pouvez aussi la rafraîchir."
            : "Merci ! Nous vérifions la disponibilité de vos articles et vous contactons rapidement pour confirmer."}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm text-muted-foreground">Référence de commande</p>
            <p className="font-mono text-lg font-semibold">{formatOrderReference(order.sequenceNumber)}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            {ORDER_STATUS_LABELS[order.orderStatus]}
          </span>
        </div>

        <div className="flex flex-col gap-2 border-b border-border py-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 border-b border-border py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span>{order.shippingFee === 0 ? "Gratuite" : formatPrice(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-4 text-sm text-muted-foreground">
          <p>
            {DELIVERY_METHOD_LABELS[order.deliveryMethod]} — {order.address}, {order.city} (
            {order.region})
          </p>
          <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <a
            href={`/api/commandes/${order.orderNumber}/facture`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            📄 Télécharger la facture
          </a>
          {order.paymentStatus === "PAID" && order.orderStatus === "DELIVERED" && (
            <a
              href={`/api/commandes/${order.orderNumber}/recu`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              🧾 Télécharger le reçu
            </a>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Gardez cette référence : elle vous permet de{" "}
        <Link href="/suivi" className="text-primary hover:underline">
          suivre votre commande
        </Link>{" "}
        à tout moment.
      </p>

      <Link href="/catalogue" className={`${primaryButtonClass} mt-6 block text-center`}>
        Continuer mes achats
      </Link>
    </div>
  );
}
