import { notFound } from "next/navigation";
import { getOrderForAdmin } from "@/server/actions/admin-orders";
import { getDeliveryPersons } from "@/server/actions/delivery-tracking";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { DeliveryAssignment } from "@/components/admin/delivery-assignment";
import { formatPrice } from "@/lib/format";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, deliveryPersons] = await Promise.all([
    getOrderForAdmin(id),
    getDeliveryPersons(),
  ]);
  if (!order) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-1 text-xl font-semibold">
          Commande {formatOrderReference(order.sequenceNumber)}
        </h1>
        <p className="mb-2 text-sm text-muted-foreground">
          {order.createdAt.toLocaleString("fr-FR")} · {order.orderNumber}
        </p>
        <div className="mb-6 flex flex-wrap gap-3">
          <a
            href={`/api/commandes/${order.orderNumber}/facture`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            📄 Facture
          </a>
          {order.paymentStatus === "PAID" && order.orderStatus === "DELIVERED" && (
            <a
              href={`/api/commandes/${order.orderNumber}/recu`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              🧾 Reçu
            </a>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Articles</h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Client et livraison</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Nom</dt>
            <dd>{order.guestName}</dd>
            <dt className="text-muted-foreground">Téléphone</dt>
            <dd>{order.guestPhone}</dd>
            <dt className="text-muted-foreground">Adresse</dt>
            <dd>
              {order.address}, {order.city} ({order.region})
            </dd>
            <dt className="text-muted-foreground">Livraison</dt>
            <dd>
              {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
              {order.deliveryZone ? ` — ${order.deliveryZone.name}` : ""}
            </dd>
            <dt className="text-muted-foreground">Paiement</dt>
            <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
            {order.notes && (
              <>
                <dt className="text-muted-foreground">Notes</dt>
                <dd>{order.notes}</dd>
              </>
            )}
          </dl>
        </div>

        {order.statusHistory.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">Historique des statuts</h2>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {order.statusHistory.map((h) => (
                <li key={h.id}>
                  {h.createdAt.toLocaleString("fr-FR")} —{" "}
                  {h.fromStatus ? `${ORDER_STATUS_LABELS[h.fromStatus]} → ` : ""}
                  {ORDER_STATUS_LABELS[h.toStatus]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Statut</h2>
          <OrderStatusControl
            orderId={order.id}
            orderStatus={order.orderStatus}
            paymentStatus={order.paymentStatus}
          />
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Livraison</h2>
          <DeliveryAssignment
            orderId={order.id}
            deliveryPersons={deliveryPersons}
            delivery={order.delivery}
          />
        </div>
      </div>
    </div>
  );
}
