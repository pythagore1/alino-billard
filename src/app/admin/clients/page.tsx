import { listCustomersForAdmin } from "@/server/actions/admin-customers";
import { CustomerRowActions } from "@/components/admin/customer-row-actions";
import { inputClass, secondaryButtonClass } from "@/lib/ui";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const customers = await listCustomersForAdmin(params.search);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un client qui n&apos;arrive plus à se connecter peut te contacter (WhatsApp) — tu peux
          lui définir un mot de passe temporaire ici, à lui communiquer. Il devra
          obligatoirement en choisir un nouveau (que tu ne connaîtras pas) à sa prochaine
          connexion.
        </p>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Nom, email ou téléphone..."
          className={inputClass}
        />
        <button type="submit" className={secondaryButtonClass}>
          Rechercher
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">Nom</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Commandes</th>
              <th className="p-3">Inscrit le</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{customer.name}</td>
                <td className="p-3 text-muted-foreground">
                  {customer.email && <div>{customer.email}</div>}
                  {customer.phone && <div>{customer.phone}</div>}
                </td>
                <td className="p-3">{customer._count.orders}</td>
                <td className="p-3 text-muted-foreground">
                  {customer.createdAt.toLocaleDateString("fr-FR")}
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <CustomerRowActions userId={customer.id} />
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Aucun client ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
