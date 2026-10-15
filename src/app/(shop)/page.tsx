import { Suspense } from "react";
import { cache } from "react";
import Link from "next/link";
import { getFeaturedProducts, getCategoryTree, getRootCategoryProductCounts } from "@/lib/catalog-queries";
import { getSiteSettings } from "@/lib/site-settings";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryCard } from "@/components/shop/category-card";
import { getCurrentUser } from "@/lib/auth/guard";
import { getMyOrders } from "@/server/actions/orders";
import { formatOrderReference } from "@/lib/order-reference";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { TrackOrderForm } from "@/components/shop/track-order-form";
import { BannerBackground } from "@/components/shop/banner-background";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { SERVICES_ENABLED } from "@/lib/features";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M2 7h11v9H2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 10h4l4 3v3h-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

const STEPS = [
  { title: "Choisissez", text: "Parcourez la boutique et ajoutez vos produits au panier." },
  { title: "Commandez", text: "Indiquez votre ville et votre quartier : livraison et paiement s'adaptent." },
  { title: "Payez et recevez", text: "À la livraison à Yaoundé ou par Mobile Money, puis livraison ou expédition." },
  { title: "Suivez", text: "Avec votre référence (RB-0142) et votre téléphone, sur la page Suivi." },
];

const REASONS = [
  { icon: ShieldIcon, title: "Commande vérifiée", text: "Chaque commande est contrôlée avant confirmation, puis préparée avec soin." },
  { icon: TruckIcon, title: "Livraison et expédition", text: "Livraison à Yaoundé, expédition dans le reste du Cameroun." },
  { icon: LockIcon, title: "Paiement sécurisé", text: "MTN ou Orange Money sur une page sécurisée, ou espèces à la livraison à Yaoundé." },
];

const FEATURES = [
  { icon: ShieldIcon, title: "Sélection d'accessoires", subtitle: "Produits de qualité" },
  { icon: TruckIcon, title: "Commande simple", subtitle: "En quelques clics" },
  { icon: PinIcon, title: "Livraison partout au Cameroun", subtitle: null },
];

/** Suivi de commande par référence (visiteur non connecté). */
function GuestTracking() {
  return (
    <>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-foreground/90">
        <span aria-hidden>📦</span>
        Suivre ma commande
      </p>
      <TrackOrderForm />
    </>
  );
}

// Lue une seule fois par requête (le bloc est affiché à deux endroits : hero
// sur grand écran, bandeau sous le hero sur mobile).
const getHomeCustomer = cache(async () => {
  const user = await getCurrentUser();
  if (user?.role !== "CUSTOMER") return null;
  const orders = await getMyOrders();
  return { firstName: (user.name ?? "").split(" ")[0], lastOrder: orders[0] ?? null };
});

/**
 * Client connecté : rappel de sa dernière commande à la place du formulaire de
 * suivi. Lit la session, donc affiché sous <Suspense> : le reste de l'accueil,
 * lui, est servi tout de suite depuis le cache.
 */
async function CustomerAwareTracking() {
  const customer = await getHomeCustomer();
  if (!customer) return <GuestTracking />;

  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="font-medium">{customer.firstName ? `Bonjour ${customer.firstName}` : "Bonjour"}</p>
      {customer.lastOrder ? (
        <p className="mt-1 text-sm text-ink-foreground/80">
          Dernière commande{" "}
          <span className="font-mono font-semibold">{formatOrderReference(customer.lastOrder.sequenceNumber)}</span> :{" "}
          {ORDER_STATUS_LABELS[customer.lastOrder.orderStatus]}
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-foreground/80">Vous n&apos;avez pas encore passé de commande.</p>
      )}
      <Link
        href="/compte"
        className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
      >
        Voir mes commandes →
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [featuredProducts, settings, allCategories, counts] = await Promise.all([
    // Tous les produits cochés "mis en avant" dans l'admin s'affichent (les
    // plus récents d'abord), avec un plafond pour garder l'accueil léger.
    getFeaturedProducts(24),
    getSiteSettings(),
    getCategoryTree(),
    getRootCategoryProductCounts(),
  ]);
  const homeCategories = allCategories.filter((c) => (counts.get(c.id) ?? 0) > 0).slice(0, 8);
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  // Photo de fond du hero facultative (déposée manuellement dans public/,
  // même logique que le logo) — tant qu'elle n'y est pas, un dégradé
  // noir → vert billard tient lieu de fond. .jpg et .png acceptés.
  const heroPhoto = getBannerPhotoUrl("hero");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <BannerBackground photoUrl={heroPhoto} priority inset={false} />
        {/* Pas de mx-auto ici volontairement sur grand écran : la bannière
            reste ancrée à gauche (petite marge fixe), contrairement au reste
            des sections qui restent centrées avec une marge égale. */}
        <div className="relative flex max-w-7xl flex-col items-start gap-4 px-4 py-9 sm:gap-5 sm:py-24 lg:pr-6 lg:pl-28">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
            {settings.storeName.toUpperCase()}
          </span>
          <h1 className="font-display max-w-2xl text-3xl leading-tight font-bold sm:text-5xl">
            Plus qu&apos;un jeu,
            <br />
            <span className="text-primary">une passion.</span>
          </h1>
          <p className="max-w-xl text-sm text-ink-foreground/80 sm:text-base">
            Queues, accessoires et essentiels pour les passionnés de billard, les
            débutants et les joueurs confirmés.
          </p>

          <div className="flex flex-wrap gap-3 pt-1 sm:pt-2">
            <Link
              href="/catalogue"
              className="flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover sm:px-6 sm:py-3 sm:text-base"
            >
              Découvrir la boutique →
            </Link>
            <Link
              href="/contact"
              className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium hover:border-primary hover:text-primary sm:px-6 sm:py-3 sm:text-base"
            >
              <span aria-hidden>✉️</span>
              Nous contacter
            </Link>
          </div>

          <div className="hidden w-full max-w-xl pt-4 lg:block">
            <Suspense fallback={<GuestTracking />}>
              <CustomerAwareTracking />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Suivi de commande — sous le hero sur mobile pour le garder compact */}
      <section className="bg-ink text-ink-foreground lg:hidden">
        <div className="mx-auto max-w-7xl px-4 pb-6">
          <Suspense fallback={<GuestTracking />}>
            <CustomerAwareTracking />
          </Suspense>
        </div>
      </section>

      {/* Atouts */}
      <section className="border-t border-white/10 bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/10 px-2 py-4 sm:px-4 sm:py-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-1.5 px-2 py-2 text-center sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-left">
              <span className="text-primary">
                <f.icon />
              </span>
              <div>
                <p className="text-[11px] leading-tight font-semibold sm:text-sm">{f.title}</p>
                {f.subtitle && <p className="hidden text-xs text-ink-foreground/60 sm:block">{f.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catégories */}
      {homeCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-16">
          <h2 className="font-display mb-6 flex items-center justify-center gap-4 text-center text-2xl font-bold sm:text-3xl">
            <span className="h-px w-10 bg-primary" />
            Nos catégories
            <span className="h-px w-10 bg-primary" />
          </h2>
          {/* Une seule liste : carrousel horizontal sur mobile, grille à partir de sm. */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-6 [&::-webkit-scrollbar]:hidden">
            {homeCategories.map((category) => (
              <div key={category.id} className="w-[44vw] max-w-52 shrink-0 snap-start sm:w-auto sm:max-w-none">
                <CategoryCard
                  slug={category.slug}
                  name={category.name}
                  imageUrl={category.imageUrl}
                  count={counts.get(category.id) ?? 0}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 text-center sm:mt-8">
            <Link href="/categories" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
              Toutes les catégories →
            </Link>
          </div>
        </section>
      )}

      {/* Produits en vedette */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
          <h2 className="font-display mb-6 flex items-center justify-center gap-4 text-center text-2xl font-bold sm:text-3xl">
            <span className="h-px w-10 bg-primary" />
            Nos incontournables
            <span className="h-px w-10 bg-primary" />
          </h2>
          {/* Une seule liste : carrousel horizontal sur mobile, grille à partir de sm. */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {featuredProducts.map((product) => (
              <div key={product.id} className="flex w-[46vw] max-w-56 shrink-0 snap-start sm:w-auto sm:max-w-none">
                <ProductCard product={product} />
              </div>
            ))}
            <Link
              href="/catalogue"
              className="flex w-[40vw] max-w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary text-center text-sm font-medium text-primary sm:hidden"
            >
              <span aria-hidden className="text-2xl">→</span>
              Voir toute la boutique
            </Link>
          </div>
          <div className="mt-8 hidden text-center sm:block">
            <Link href="/catalogue" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
              Voir toute la boutique →
            </Link>
          </div>
        </section>
      )}

      {/* Comment commander */}
      <section className="bg-cream-muted">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
          <h2 className="font-display mb-8 flex items-center justify-center gap-4 text-center text-2xl font-bold sm:text-3xl">
            <span className="hidden h-px w-10 bg-primary sm:block" />
            Comment commander
            <span className="hidden h-px w-10 bg-primary sm:block" />
          </h2>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 lg:flex-col">
                <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 text-center">
            <Link href="/guide" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
              Lire le guide d&apos;achat →
            </Link>
          </div>
        </div>
      </section>

      {/* Pourquoi nous */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="font-display mb-3 text-2xl font-bold sm:text-3xl">Pourquoi {settings.storeName} ?</h2>
            <p className="text-muted-foreground">
              Nous travaillons directement avec des grossistes spécialisés pour vous garantir du matériel de
              qualité, que le produit soit en stock ou récupéré spécialement pour votre commande. Chaque commande
              est vérifiée, préparée et livrée avec soin.
            </p>
            {SERVICES_ENABLED && (
              <p className="mt-4 text-muted-foreground">
                Installation et démontage de table, changement de procédé, réparation de queue, remplacement de
                virole...{" "}
                <Link href="/services" className="text-primary hover:underline">
                  Voir tous les services →
                </Link>
              </p>
            )}
          </div>
          <ul className="flex flex-col gap-4">
            {REASONS.map((r) => (
              <li key={r.title} className="flex gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
                <span className="mt-0.5 shrink-0 text-primary">
                  <r.icon />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="bg-cream-muted">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:py-14">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Prêt à équiper votre jeu ?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/catalogue"
              className="flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Découvrir la boutique →
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
              >
                Nous contacter sur WhatsApp
              </a>
            ) : (
              <Link
                href="/contact"
                className="flex min-h-12 items-center justify-center rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
              >
                Nous contacter
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
