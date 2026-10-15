import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guard";
import { getMyOrders } from "@/server/actions/orders";
import { signOutAction } from "@/server/actions/session";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";
import { PageHero } from "@/components/shop/page-hero";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/compte/connexion?callbackUrl=/compte");
  }

  const [orders, profile] = await Promise.all([
    getMyOrders(),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, phone: true } }),
  ]);
  const name = profile?.name ?? user.name ?? "";
  const firstName = name.split(" ")[0];

  const details = [
    { label: "Téléphone", value: profile?.phone },
    { label: "E-mail", value: profile?.email },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value));

  return (
    <div>
      <PageHero title="Mon compte" subtitle={firstName ? `Bonjour ${firstName}.` : undefined} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div>
              <h2 className="font-display text-xl font-bold">{name}</h2>
              <dl className="mt-2 flex flex-col gap-1 text-sm">
                {details.map((d) => (
                  <div key={d.label} className="flex gap-2">
                    <dt className="text-muted-foreground">{d.label} :</dt>
                    <dd className="break-all">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium hover:border-primary hover:text-primary"
              >
                Se déconnecter
              </button>
            </form>
          </section>

          <section>
            <h2 className="font-display mb-4 text-2xl font-bold">Mes commandes</h2>

            {orders.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-6 text-center">
                <p className="text-muted-foreground">Vous n&apos;avez pas encore passé de commande.</p>
                <Link
                  href="/catalogue"
                  className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  Découvrir la boutique →
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {orders.map((order) => {
                  const hasReceipt = order.paymentStatus === "PAID" && order.orderStatus === "DELIVERED";
                  return (
                    <li key={order.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-base font-semibold">
                            {formatOrderReference(order.sequenceNumber)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt.toLocaleDateString("fr-FR")} · {order.items.length} article
                            {order.items.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
                            {ORDER_STATUS_LABELS[order.orderStatus]}
                          </span>
                          <span className="font-semibold">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 border-t border-border pt-1 text-sm font-medium text-primary">
                        <Link
                          href={`/commande/confirmation/${order.orderNumber}`}
                          className="flex min-h-11 items-center hover:underline"
                        >
                          Voir le détail
                        </Link>
                        <a
                          href={`/api/commandes/${order.orderNumber}/facture`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-11 items-center hover:underline"
                        >
                          Facture
                        </a>
                        {hasReceipt && (
                          <a
                            href={`/api/commandes/${order.orderNumber}/recu`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-11 items-center hover:underline"
                          >
                            Reçu
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
