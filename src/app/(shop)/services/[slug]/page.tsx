import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SERVICES_ENABLED } from "@/lib/features";
import { getServiceBySlug } from "@/server/actions/services";
import { formatPrice } from "@/lib/format";
import { QuoteRequestForm } from "@/components/shop/quote-request-form";
import { ServiceBookingForm } from "@/components/shop/service-booking-form";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!SERVICES_ENABLED) return {};
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return { title: service.name, description: service.description ?? undefined };
}

const PRICING_LABELS: Record<string, string> = {
  FIXED: "",
  STARTING_AT: "À partir de ",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!SERVICES_ENABLED) notFound();
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const image = service.images[0]?.media;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-surface-muted sm:aspect-square">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes
            <img
              src={cloudinaryOptimized(image.url, 600)}
              alt={image.altText ?? service.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">🛠️</div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{service.name}</h1>

          <p className="mt-3 text-xl font-semibold text-primary">
            {service.pricingType === "QUOTE_ONLY"
              ? "Sur devis"
              : `${PRICING_LABELS[service.pricingType]}${formatPrice(service.price ?? 0)}`}
          </p>

          {service.durationEstimate && (
            <p className="mt-2 text-sm text-muted-foreground">
              Durée estimée : {service.durationEstimate}
            </p>
          )}
          {service.interventionZone && (
            <p className="text-sm text-muted-foreground">
              Zone d&apos;intervention : {service.interventionZone}
            </p>
          )}

          {service.description && <p className="mt-4 text-muted-foreground">{service.description}</p>}
        </div>
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        {service.isBookable && (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Prendre rendez-vous</h2>
            <ServiceBookingForm serviceId={service.id} />
          </div>
        )}
        {service.isQuotable && (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Demander un devis</h2>
            <QuoteRequestForm serviceId={service.id} />
          </div>
        )}
      </div>
    </div>
  );
}
