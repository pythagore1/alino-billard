import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES_ENABLED } from "@/lib/features";
import { getActiveServices } from "@/server/actions/services";
import { formatPrice } from "@/lib/format";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Installation de table, réparation de queue, changement de procédé... les services Alino Billard & Accessoires.",
};

const PRICING_LABELS: Record<string, string> = {
  FIXED: "",
  STARTING_AT: "À partir de ",
  QUOTE_ONLY: "Sur devis",
};

export default async function ServicesPage() {
  if (!SERVICES_ENABLED) notFound();
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Nos services</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Installation, entretien et réparation de tables et queues de billard —
        en boutique ou à domicile.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const image = service.images[0]?.media;
          return (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
            >
              <div className="aspect-video overflow-hidden bg-surface-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes
                  <img
                    src={cloudinaryOptimized(image.url, 400)}
                    alt={image.altText ?? service.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">🛠️</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="font-medium">{service.name}</p>
                {service.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                )}
                <p className="mt-auto font-semibold text-primary">
                  {service.pricingType === "QUOTE_ONLY"
                    ? PRICING_LABELS.QUOTE_ONLY
                    : `${PRICING_LABELS[service.pricingType]}${formatPrice(service.price ?? 0)}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
