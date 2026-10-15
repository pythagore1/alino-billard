import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "ALINO-Billard, entreprise spécialisée dans la vente de matériel de pool américain : matériel vérifié, livraison à Yaoundé, expédition dans tout le pays.",
};

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-6 w-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  "aria-hidden": true,
} as const;

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
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

function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 5.5h16v10H9.5L5 19v-3.5H4v-10Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const COMMITMENTS = [
  {
    icon: CheckIcon,
    title: "Commande vérifiée",
    text: "Chaque commande est contrôlée avant confirmation, puis préparée avec soin.",
  },
  {
    icon: TruckIcon,
    title: "Livraison au Cameroun",
    text: "Livraison à Yaoundé et expédition dans le reste du pays.",
  },
  {
    icon: LockIcon,
    title: "Paiement sécurisé",
    text: "Paiement à la livraison à Yaoundé, ou par Mobile Money (MTN / Orange Money) sur une page de paiement sécurisée : vous ne saisissez jamais vos codes sur notre site.",
  },
  {
    icon: ChatIcon,
    title: "Une question ?",
    text: "Un produit, une disponibilité, une commande : contactez-nous, nous vous répondons directement.",
  },
];

const STEPS = [
  { title: "Choisissez", text: "Parcourez la boutique et ajoutez vos produits au panier." },
  {
    title: "Commandez",
    text: "Indiquez votre région, votre ville et votre quartier : les options de livraison et de paiement s'adaptent à votre ville.",
  },
  {
    title: "Payez et recevez",
    text: "Paiement à la livraison à Yaoundé ou par Mobile Money, puis livraison ou expédition de votre commande.",
  },
  {
    title: "Suivez",
    text: "Avec votre référence de commande (par exemple RB-0142) et votre téléphone, suivez l'avancement sur la page Suivi.",
  },
];

export default async function AboutPage() {
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
            ALINOBILLARD
          </span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">À propos</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/80">
            Le matériel de billard, vérifié avec soin et livré partout au Cameroun.
          </p>
        </div>
      </section>

      {/* Qui nous sommes */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="max-w-3xl">
          <h2 className="font-display mb-4 text-2xl font-bold sm:text-3xl">Qui sommes-nous ?</h2>
          <div className="flex flex-col gap-4 text-muted-foreground">
            <p>
              {settings.storeName} est une entreprise spécialisée dans la vente de queues,
              boules, procédés, étuis, tapis et accessoires de pool américain (8-ball, 9-ball,
              10-ball), pour les joueurs amateurs comme confirmés.
            </p>
            <p>
              Nous travaillons avec des grossistes pour vous proposer du matériel de qualité, que
              le produit soit en stock ou récupéré spécialement pour votre commande. Chaque
              commande est vérifiée avant confirmation, préparée avec soin, puis livrée.
            </p>
          </div>
        </div>
      </section>

      {/* Engagements */}
      <section className="bg-cream-muted">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <h2 className="font-display mb-6 text-2xl font-bold sm:text-3xl">Nos engagements</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {COMMITMENTS.map((c) => (
              <div key={c.title} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
                <span className="mt-0.5 shrink-0 text-primary">
                  <c.icon />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <h2 className="font-display mb-6 text-2xl font-bold sm:text-3xl">Comment ça marche</h2>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 lg:flex-col">
              <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                {index === STEPS.length - 1 && (
                  <Link href="/suivi" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                    Suivre ma commande →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Réassurance */}
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:gap-6">
          <p className="flex items-center gap-3 text-sm sm:justify-center">
            <span className="text-primary">
              <LockIcon />
            </span>
            Paiement à la livraison ou Mobile Money
          </p>
          <p className="flex items-center gap-3 text-sm sm:justify-center">
            <span className="text-primary">
              <TruckIcon />
            </span>
            Yaoundé et tout le Cameroun
          </p>
          <p className="flex items-center gap-3 text-sm sm:justify-center">
            <span className="text-primary">
              <CheckIcon />
            </span>
            Suivi de commande en ligne
          </p>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="mx-auto max-w-7xl px-4 py-10 text-center sm:py-14">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Prêt à équiper votre jeu ?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/catalogue"
            className="flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Découvrir la boutique →
          </Link>
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
            >
              Nous contacter sur WhatsApp
            </a>
          ) : (
            <Link
              href="/contact"
              className="flex min-h-11 items-center rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
            >
              Nous contacter
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
