import Link from "next/link";
import { listServicesForAdmin } from "@/server/actions/services";
import { ServiceRowActions } from "@/components/admin/service-row-actions";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

const PRICING_LABELS: Record<string, string> = {
  FIXED: "Prix fixe",
  STARTING_AT: "À partir de",
  QUOTE_ONLY: "Devis uniquement",
};

export default async function AdminServicesPage() {
  const services = await listServicesForAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Services</h1>
        <Link href="/admin/services/nouveau" className={primaryButtonClass}>
          + Nouveau service
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">Service</th>
              <th className="p-3">Tarification</th>
              <th className="p-3">RDV / Devis</th>
              <th className="p-3">Statut</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="font-medium hover:underline"
                  >
                    {service.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {service._count.bookings} RDV · {service._count.quotes} devis
                  </p>
                </td>
                <td className="p-3 text-muted-foreground">
                  {PRICING_LABELS[service.pricingType]}
                  {service.price ? ` · ${service.price.toLocaleString("fr-FR")} FCFA` : ""}
                </td>
                <td className="p-3 text-muted-foreground">
                  {service.isBookable ? "RDV" : ""}
                  {service.isBookable && service.isQuotable ? " · " : ""}
                  {service.isQuotable ? "Devis" : ""}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      service.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {service.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/admin/services/${service.id}`} className={secondaryButtonClass}>
                      Modifier
                    </Link>
                    <ServiceRowActions id={service.id} isActive={service.isActive} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
