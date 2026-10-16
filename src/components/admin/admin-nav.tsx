"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";

const LINKS: Array<{ href: string; label: string; roles: Role[] }> = [
  { href: "/admin", label: "Tableau de bord", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/commandes", label: "Commandes", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/clients", label: "Clients", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/mes-livraisons", label: "Mes livraisons", roles: ["DELIVERY"] },
  { href: "/admin/paiements", label: "Paiements", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/produits", label: "Produits", roles: ["SUPER_ADMIN"] },
  { href: "/admin/categories", label: "Catégories", roles: ["SUPER_ADMIN"] },
  { href: "/admin/services", label: "Services", roles: ["SUPER_ADMIN"] },
  { href: "/admin/livraison", label: "Zones de livraison", roles: ["SUPER_ADMIN"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs", roles: ["SUPER_ADMIN"] },
  { href: "/admin/parametres", label: "Paramètres", roles: ["SUPER_ADMIN"] },
];

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visibleLinks = LINKS.filter((link) => link.roles.includes(role));

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border bg-surface px-6 py-2 text-sm">
      {visibleLinks.map((link) => {
        // "/admin" ne doit être actif que sur la page exacte, sinon il
        // resterait "actif" sur toutes les sous-pages admin.
        const isActive =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded px-3 py-1.5 transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
