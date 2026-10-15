"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// `icon` est du JSX déjà rendu (ex: <HomeIcon />), pas une référence de
// composant — une fonction ne peut pas traverser la frontière Server/Client
// Component, un élément React déjà construit oui.
type NavLink = { href: string; label: string; icon: ReactNode };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Version sans lecture de l'adresse : affichée pendant que la vraie version se
// charge (aucun lien actif), pour que le menu fasse partie de la page statique.
export function NavLinksFallback({ links }: { links: NavLink[] }) {
  return <NavLinksView links={links} pathname="" />;
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return <NavLinksView links={links} pathname={pathname} />;
}

function NavLinksView({ links, pathname }: { links: NavLink[]; pathname: string }) {

  return (
    <nav className="hidden items-center gap-0.5 text-sm lg:flex">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 ${
              active ? "bg-primary/15 text-primary" : "hover:bg-white/10 hover:text-primary"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
