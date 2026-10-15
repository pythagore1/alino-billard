import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Alino Billard & Accessoires par WhatsApp, téléphone ou e-mail pour une question sur un produit ou une commande.",
};

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-6 w-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  "aria-hidden": true,
} as const;

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.09h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.15 8.15 0 0 1-1.26-4.33c0-4.5 3.66-8.17 8.16-8.17 2.18 0 4.23.85 5.77 2.39a8.11 8.11 0 0 1 2.39 5.78c0 4.5-3.67 8.2-8.08 8.2Zm4.47-6.13c-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.95-1.21-.72-.64-1.2-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path
        d="M5 4h4l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2L15 12.5l4 1.5v4a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7.5 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 7h11v9H2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 10h4l4 3v3h-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" strokeLinejoin="round" />
      <path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function digits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const bannerPhoto = getBannerPhotoUrl("boutique");

  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${digits(settings.whatsappNumber)}?text=${encodeURIComponent("Bonjour Alino Billard & Accessoires, j'aimerais avoir des renseignements.")}`
    : null;
  const phoneHref = settings.contactPhone ? `tel:+${digits(settings.contactPhone)}` : null;
  const emailHref = settings.contactEmail ? `mailto:${settings.contactEmail}` : null;

  // Même numéro pour WhatsApp et téléphone : une seule carte, pas de doublon.
  const phoneIsSameAsWhatsApp =
    !!settings.whatsappNumber &&
    !!settings.contactPhone &&
    digits(settings.whatsappNumber) === digits(settings.contactPhone);

  const contacts = [
    whatsappHref && {
      key: "whatsapp",
      icon: <WhatsAppIcon />,
      label: phoneIsSameAsWhatsApp ? "WhatsApp et téléphone" : "WhatsApp",
      value: settings.whatsappNumber!,
      href: whatsappHref,
      external: true,
    },
    phoneHref && !phoneIsSameAsWhatsApp && {
      key: "phone",
      icon: <PhoneIcon />,
      label: "Téléphone",
      value: settings.contactPhone!,
      href: phoneHref,
      external: false,
    },
    emailHref && {
      key: "email",
      icon: <MailIcon />,
      label: "E-mail",
      value: settings.contactEmail!,
      href: emailHref,
      external: false,
    },
  ].filter(Boolean) as {
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    href: string;
    external: boolean;
  }[];

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
            ALINO BILLARD & ACCESSOIRES
          </span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Contact</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/80">
            Une question sur un produit ou sur une commande ? Écrivez-nous, nous vous répondons directement.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12">
        <section>
          <h2 className="font-display mb-4 text-2xl font-bold">Nous joindre</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-medium text-white hover:opacity-90"
              >
                <WhatsAppIcon />
                Écrire sur WhatsApp
              </a>
            )}
            {phoneHref && (
              <a
                href={phoneHref}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
              >
                <PhoneIcon />
                Appeler
              </a>
            )}
            {emailHref && (
              <a
                href={emailHref}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
              >
                <MailIcon />
                Envoyer un e-mail
              </a>
            )}
          </div>

          <ul className="mt-6 flex flex-col gap-3">
            {contacts.map((c) => (
              <li key={c.key}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex min-h-16 items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:border-primary"
                >
                  <span className="shrink-0 text-primary">{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">{c.label}</span>
                    <span className="block font-medium break-words">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-4 text-2xl font-bold">Besoin d&apos;aide rapidement ?</h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/suivi"
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 hover:border-primary"
            >
              <span className="mt-0.5 shrink-0 text-primary">
                <BoxIcon />
              </span>
              <span>
                <span className="font-display block text-lg font-bold">Suivre ma commande</span>
                <span className="block text-sm text-muted-foreground">
                  Avec votre référence (par exemple RB-0142) et votre téléphone, consultez l&apos;avancement de votre
                  commande.
                </span>
              </span>
            </Link>

            <Link
              href="/guide"
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 hover:border-primary"
            >
              <span className="mt-0.5 shrink-0 text-primary">
                <BookIcon />
              </span>
              <span>
                <span className="font-display block text-lg font-bold">Guide d&apos;achat</span>
                <span className="block text-sm text-muted-foreground">
                  Comment commander, payer et suivre votre commande, étape par étape.
                </span>
              </span>
            </Link>

            <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
              <span className="mt-0.5 shrink-0 text-primary">
                <PinIcon />
              </span>
              <span>
                <span className="font-display block text-lg font-bold">Notre boutique</span>
                <span className="block text-sm text-muted-foreground">Carrefour Jouvence, Yaoundé.</span>
              </span>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
              <span className="mt-0.5 shrink-0 text-primary">
                <TruckIcon />
              </span>
              <span>
                <span className="font-display block text-lg font-bold">Livraison</span>
                <span className="block text-sm text-muted-foreground">
                  Livraison à Yaoundé et expédition dans le reste du Cameroun.
                </span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
