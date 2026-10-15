import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";
import { TrackOrderForm } from "@/components/shop/track-order-form";

export const metadata: Metadata = {
  title: "Suivi de commande",
  description: "Suivez votre commande Alino Billard & Accessoires avec votre référence et votre numéro de téléphone.",
};

export default async function TrackOrderPage() {
  const settings = await getSiteSettings();
  const bannerPhoto = getBannerPhotoUrl("boutique");
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
            ALINO BILLARD & ACCESSOIRES
          </span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Suivi de commande</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/80">
            Saisissez la référence reçue à la commande et votre numéro de téléphone.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <TrackOrderForm variant="page" whatsappHref={whatsappHref} />

          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold">Où trouver ma référence ?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Elle s&apos;affiche sur la page de confirmation, juste après votre commande. Elle ressemble à
              RB-0142. Utilisez le même numéro de téléphone que celui indiqué lors de la commande.
            </p>
            <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:gap-6">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center font-medium text-primary hover:underline"
                >
                  Référence perdue ? Écrivez-nous sur WhatsApp →
                </a>
              )}
              <Link href="/guide" className="flex min-h-11 items-center font-medium text-primary hover:underline">
                Comment commander →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
