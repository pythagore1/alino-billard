import {
  getMyDeliveries,
  type MyDeliveriesSort,
} from "@/server/actions/delivery-tracking";
import { MyDeliveryStatusControl } from "@/components/admin/my-delivery-status-control";
import { formatPrice } from "@/lib/format";
import {
  DELIVERY_METHOD_LABELS,
  DELIVERY_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";
import { inputClass, secondaryButtonClass } from "@/lib/ui";
import type { DeliveryStatus } from "@/generated/prisma/enums";

const SORT_LABELS: Record<MyDeliveriesSort, string> = {
  newest: "Plus récentes d'abord",
  oldest: "Plus anciennes d'abord",
};

export default async function MyDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sort = (params.sort as MyDeliveriesSort) || "newest";
  const deliveries = await getMyDeliveries({
    status: params.status as DeliveryStatus | undefined,
    sort,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Mes livraisons</h1>

      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <select name="status" defaultValue={params.status ?? ""} className={inputClass}>
          <option value="">Tous les statuts</option>
          {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className={inputClass}>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Filtrer
        </button>
      </form>

      {deliveries.length === 0 ? (
        <p className="text-muted-foreground">
          {params.status
            ? "Aucune livraison ne correspond à ce filtre."
            : "Aucune livraison ne t’est assignée pour le moment."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-semibold">
                    {formatOrderReference(delivery.order.sequenceNumber)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {delivery.order.guestName} — {delivery.order.guestPhone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {delivery.order.address}, {delivery.order.city} ({delivery.order.region})
                  </p>
                  <p className="mt-1 text-sm">
                    {DELIVERY_METHOD_LABELS[delivery.order.deliveryMethod]} ·{" "}
                    {PAYMENT_METHOD_LABELS[delivery.order.paymentMethod]} ·{" "}
                    {formatPrice(delivery.order.total)}
                  </p>
                  <ul className="mt-2 text-xs text-muted-foreground">
                    {delivery.order.items.map((item) => (
                      <li key={item.id}>
                        {item.productName} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <MyDeliveryStatusControl deliveryId={delivery.id} status={delivery.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
