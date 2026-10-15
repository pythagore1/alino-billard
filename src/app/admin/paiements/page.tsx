import Link from "next/link";
import { listPaymentsForAdmin } from "@/server/actions/admin-payments";
import { formatPrice } from "@/lib/format";
import { formatOrderReference } from "@/lib/order-reference";

const PROVIDER_LABELS: Record<string, string> = {
  NOTCHPAY: "NotchPay (Mobile Money)",
  MONETBIL: "Monetbil (Mobile Money)",
  CASH_ON_DELIVERY: "Paiement à la livraison",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SUCCESS: "Réussi",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SUCCESS: "bg-primary/10 text-primary",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-surface-muted text-muted-foreground",
};

export default async function AdminPaymentsPage() {
  const payments = await listPaymentsForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Paiements</h1>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">Référence</th>
              <th className="p-3">Commande</th>
              <th className="p-3">Fournisseur</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-border last:border-0">
                <td className="p-3 font-mono text-xs">{payment.providerReference}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/commandes/${payment.orderId}`}
                    className="hover:underline"
                  >
                    {formatOrderReference(payment.order.sequenceNumber)}
                  </Link>
                  <p className="text-xs text-muted-foreground">{payment.order.guestName}</p>
                </td>
                <td className="p-3 text-muted-foreground">{PROVIDER_LABELS[payment.provider]}</td>
                <td className="p-3">{formatPrice(payment.amount)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[payment.status]}`}>
                    {STATUS_LABELS[payment.status]}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {payment.createdAt.toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Aucune transaction pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
