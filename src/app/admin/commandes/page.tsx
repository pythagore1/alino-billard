import Link from "next/link";
import { listOrdersForAdmin } from "@/server/actions/admin-orders";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";
import { inputClass, secondaryButtonClass } from "@/lib/ui";
import type { OrderStatus } from "@/generated/prisma/enums";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const orders = await listOrdersForAdmin({
    search: params.search,
    status: params.status as OrderStatus | undefined,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Commandes</h1>

      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="N° commande, nom, téléphone..."
          className={inputClass}
        />
        <select name="status" defaultValue={params.status ?? ""} className={inputClass}>
          <option value="">Tous les statuts</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Filtrer
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">Commande</th>
              <th className="p-3">Client</th>
              <th className="p-3">Articles</th>
              <th className="p-3">Total</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link href={`/admin/commandes/${order.id}`} className="font-mono text-xs hover:underline">
                    {formatOrderReference(order.sequenceNumber)}
                  </Link>
                </td>
                <td className="p-3">
                  {order.guestName}
                  <p className="text-xs text-muted-foreground">{order.guestPhone}</p>
                </td>
                <td className="p-3 text-muted-foreground">{order.items.length}</td>
                <td className="p-3">{formatPrice(order.total)}</td>
                <td className="p-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {ORDER_STATUS_LABELS[order.orderStatus]}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {order.createdAt.toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
