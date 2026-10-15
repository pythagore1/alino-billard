import fs from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSiteSettings } from "@/lib/site-settings";
import { NavLinks, NavLinksFallback } from "@/components/shop/nav-links";
import { SERVICES_ENABLED } from "@/lib/features";
import { MobileTabBarFallback } from "@/components/shop/mobile-tab-bar";
import { HeaderActions, HeaderActionsLive, TabBarLive } from "@/components/shop/header-actions";
import { MobileSearch } from "@/components/shop/mobile-search";
import { HomeIcon, CartIcon, GridIcon, WrenchIcon, BookIcon, InfoIcon, ChatIcon } from "@/components/shop/nav-icons";

const ALL_NAV_LINKS = [
  { href: "/", label: "Accueil", icon: <HomeIcon /> },
  { href: "/catalogue", label: "Boutique", icon: <CartIcon /> },
  { href: "/categories", label: "Catégories", icon: <GridIcon /> },
  { href: "/services", label: "Services", icon: <WrenchIcon /> },
  { href: "/guide", label: "Guide d'achat", icon: <BookIcon /> },
  { href: "/a-propos", label: "À propos", icon: <InfoIcon /> },
  { href: "/contact", label: "Contact", icon: <ChatIcon /> },
];

const NAV_LINKS = ALL_NAV_LINKS.filter((l) => SERVICES_ENABLED || l.href !== "/services");

export async function SiteHeader() {
  // Seuls les paramètres (en cache) sont lus ici : l'en-tête fait ainsi partie
  // de la page servie depuis le CDN. Le panier et la session du visiteur, eux,
  // arrivent juste après (voir <Suspense> plus bas), avec un état neutre
  // affiché entre-temps.
  const settings = await getSiteSettings();

  // Le logo n'est pas toujours présent (déposé manuellement dans public/) :
  // on bascule automatiquement de l'image vers le nom de la boutique en
  // texte tant qu'il n'est pas là, sans code à changer une fois qu'il arrive.
  const hasLogoFile = fs.existsSync(path.join(process.cwd(), "public", "logo.png"));

  return (
    <header className="sticky top-0 z-40 bg-ink text-ink-foreground">
      {/* Pas de mx-auto ni de max-w ici volontairement : le header occupe
          toute la largeur (justify-between va jusqu'au bord droit), avec
          juste une petite marge gauche fixe — contrairement au reste du
          site qui reste centré avec une marge égale des deux côtés. */}
      <div className="flex w-full items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 lg:pr-6 lg:pl-28">
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            {hasLogoFile ? (
              <Image
                src="/logo.png"
                alt={settings.storeName}
                width={56}
                height={56}
                priority
                className="h-10 w-10 sm:h-14 sm:w-14"
              />
            ) : null}
            <span className="font-display text-sm font-bold tracking-wide whitespace-nowrap text-primary sm:text-lg">
              {settings.storeName.toUpperCase()}
            </span>
          </Link>
        </div>

        <Suspense fallback={<NavLinksFallback links={NAV_LINKS} />}>
          <NavLinks links={NAV_LINKS} />
        </Suspense>

        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-3">
          <MobileSearch />
          <Suspense fallback={<HeaderActions loggedIn={false} cartCount={0} />}>
            <HeaderActionsLive />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<MobileTabBarFallback cartCount={0} accountHref="/compte/connexion" />}>
        <TabBarLive />
      </Suspense>
    </header>
  );
}
