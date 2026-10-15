import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

/** En-tête de page commun (photo de salle, nom de la marque, titre). */
export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden text-ink-foreground">
      <BannerBackground photoUrl={getBannerPhotoUrl("boutique")} priority />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
          ALINOBILLARD
        </span>
        <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-ink-foreground/80">{subtitle}</p>}
      </div>
    </section>
  );
}
