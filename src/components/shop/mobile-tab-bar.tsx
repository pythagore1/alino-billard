"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, StoreIcon, GridIcon, CartIcon, UserIcon } from "@/components/shop/nav-icons";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type TabBarProps = { cartCount: number; accountHref: string };

// Version sans lecture de l'adresse (aucun onglet actif) : affichée avant que la
// version personnalisée ne se charge.
export function MobileTabBarFallback(props: TabBarProps) {
  return <MobileTabBarView {...props} pathname="" />;
}

export function MobileTabBar(props: TabBarProps) {
  const pathname = usePathname();
  return <MobileTabBarView {...props} pathname={pathname} />;
}

function MobileTabBarView({ cartCount, accountHref, pathname }: TabBarProps & { pathname: string }) {
  const tabs = [
    { href: "/", label: "Accueil", icon: <HomeIcon className="h-6 w-6" /> },
    { href: "/catalogue", label: "Boutique", icon: <StoreIcon className="h-6 w-6" /> },
    { href: "/categories", label: "Catégories", icon: <GridIcon className="h-6 w-6" /> },
    { href: "/panier", label: "Panier", icon: <CartIcon className="h-6 w-6" />, badge: cartCount },
    { href: accountHref, label: "Compte", icon: <UserIcon className="h-6 w-6" /> },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] text-ink-foreground lg:hidden"
    >
      <ul className="grid h-14 grid-cols-5">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href) || (tab.label === "Compte" && pathname.startsWith("/compte"));
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? "text-primary" : "text-ink-foreground/75 active:text-primary"
                }`}
              >
                <span className="relative">
                  {tab.icon}
                  {tab.badge ? (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {tab.badge}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
