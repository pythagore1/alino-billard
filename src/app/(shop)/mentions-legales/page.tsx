import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";
import { OWNER_NAME, OWNER_CITY } from "@/lib/seller";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Alino Billard & Accessoires : éditeur, hébergement, données personnelles.",
};

const LAST_UPDATED = "9 octobre 2026";

const linkClass = "text-primary hover:underline";

export default async function LegalNoticePage() {
  const settings = await getSiteSettings();
  const bannerPhoto = getBannerPhotoUrl("boutique");
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;
  const hasContact = Boolean(settings.contactEmail || whatsappHref);

  const contact = (
    <>
      {settings.contactEmail ? (
        <a href={`mailto:${settings.contactEmail}`} className={linkClass}>
          {settings.contactEmail}
        </a>
      ) : null}
      {settings.contactEmail && whatsappHref ? " · " : null}
      {whatsappHref ? (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
          WhatsApp {settings.whatsappNumber}
        </a>
      ) : null}
    </>
  );

  const sections = [
    {
      title: "Éditeur du site",
      body: (
        <>
          <p>
            {settings.storeName}, exploité par {OWNER_NAME}, vendeur individuel.
          </p>
          <p>Ville : {OWNER_CITY}.</p>
          {hasContact && <p>Contact : {contact}</p>}
        </>
      ),
    },
    {
      title: "Identification",
      body: <p>Numéro d&apos;identification unique (NIU) : en cours d&apos;obtention.</p>,
    },
    {
      title: "Hébergement",
      body: <p>Le site est hébergé par Vercel Inc. (vercel.com).</p>,
    },
    {
      title: "Données personnelles",
      body: (
        <>
          <p>
            Nous collectons votre nom, votre téléphone, votre adresse de livraison (région, ville, quartier) et,
            si vous créez un compte, votre e-mail (facultatif).
          </p>
          <p>
            Ces données servent à traiter, livrer et suivre votre commande. Elles sont accessibles à
            l&apos;éditeur du site. Le paiement par Mobile Money s&apos;effectue sur la page de paiement de notre
            prestataire NotchPay.
          </p>
          <p>
            Pour demander la modification ou la suppression de vos données, contactez-nous
            {hasContact ? <> : {contact}</> : null}.
          </p>
        </>
      ),
    },
    {
      title: "Propriété du contenu",
      body: (
        <p>
          Les textes, le logo et les photos présents sur ce site sont la propriété de l&apos;éditeur ou utilisés
          avec son autorisation. Toute reproduction sans accord préalable est interdite.
        </p>
      ),
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
            ALINO BILLARD & ACCESSOIRES
          </span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Mentions légales</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/80">
            Qui édite ce site, où il est hébergé et comment vos données sont utilisées.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <h2 className="font-display text-xl font-bold">{section.title}</h2>
              <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {section.body}
              </div>
            </section>
          ))}

          <div className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:gap-6">
            <Link href="/cgv" className="flex min-h-11 items-center text-primary hover:underline">
              Conditions générales de vente →
            </Link>
            <Link href="/contact" className="flex min-h-11 items-center text-primary hover:underline">
              Nous contacter →
            </Link>
          </div>

          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            Dernière mise à jour : {LAST_UPDATED}.
          </p>
        </div>
      </div>
    </div>
  );
}
