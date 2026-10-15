"use client";

import { useState } from "react";
import { SearchIcon } from "@/components/shop/nav-icons";

export function MobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer la recherche" : "Rechercher un produit"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full hover:text-primary"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
      {open && (
        <form
          action="/catalogue"
          method="GET"
          className="absolute inset-x-0 top-full border-t border-white/10 bg-ink px-3 py-2"
        >
          <input
            type="search"
            name="q"
            autoFocus
            placeholder="Rechercher un produit..."
            className="h-11 w-full rounded-full border border-white/20 bg-white px-4 text-base text-foreground focus:border-primary focus:outline-none"
          />
        </form>
      )}
    </div>
  );
}
