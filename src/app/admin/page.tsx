import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/server/actions/dashboard";
import { getCurrentUser } from "@/lib/auth/guard";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatOrderReference } from "@/lib/order-reference";

export default async function AdminDashboardPage() {
  // Le layout /admin autorise DELIVERY à entrer dans la zone admin (pour
  // "Mes livraisons"), mais le tableau de bord (chiffre d'affaires, etc.)
  // n'a rien à voir avec ce rôle — on le redirige vers son propre espace
  // plutôt que de lui montrer des données qui ne le concernent pas.
  const user = await getCurrentUser();
  if (user?.role === "DELIVERY") {
    redirect("/admin/mes-livraisons");
  }

  const stats = await getDashboardStats();

  const topStats = [
    { label: "Chiffre d'affaires total", value: formatPrice(stats.totalRevenue) },
    { label: "Chiffre d'affaires (ce mois)", value: formatPrice(stats.monthRevenue) },
    { label: "Commandes totales", value: String(stats.orderCount) },
    { label: "Commandes en attente", value: String(stats.pendingOrderCount) },
    { label: "Produits actifs", value: String(stats.productCount) },
    { label: "Catégories", value: String(stats.categoryCount) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 text-xl font-semibold">Tableau de bord</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {topStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Commandes récentes</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {stats.recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="p-3">
                        <Link href={`/admin/commandes/${order.id}`} className="font-mono text-xs hover:underline">
                          {formatOrderReference(order.sequenceNumber)}
                        </Link>
                        <p className="text-xs text-muted-foreground">{order.guestName}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{ORDER_STATUS_LABELS[order.orderStatus]}</td>
                      <td className="p-3 text-right">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Produits les plus vendus</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {stats.topProducts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucune vente pour le moment.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {stats.topProducts.map((p) => (
                    <tr key={p.productId} className="border-b border-border last:border-0">
                      <td className="p-3">{p.productName}</td>
                      <td className="p-3 text-right text-muted-foreground">{p.quantitySold} vendu(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Livreurs</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          {stats.courierStats.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Aucun compte livreur pour le moment —{" "}
              <Link href="/admin/utilisateurs" className="text-primary hover:underline">
                en créer un
              </Link>
              .
            </p>
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3">Livreur</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Livraisons assignées</th>
                  <th className="p-3">Livraisons effectuées</th>
                </tr>
              </thead>
              <tbody>
                {stats.courierStats.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          c.isActive ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted-foreground"
                        }`}
                      >
                        {c.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="p-3">{c.assigned}</td>
                    <td className="p-3">{c.delivered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
