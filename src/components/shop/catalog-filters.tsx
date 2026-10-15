"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { CatalogSort } from "@/lib/catalog-queries";

// Délai après la dernière frappe avant de relancer la recherche — assez
// court pour paraître "automatique", assez long pour ne pas soumettre à
// chaque lettre tapée.
const SEARCH_DEBOUNCE_MS = 500;

export function CatalogFilters({
  search,
  sort,
  basePath = "/catalogue",
}: {
  search?: string;
  sort?: CatalogSort;
  basePath?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isFiltered = Boolean(search) || (sort !== undefined && sort !== "newest");

  function handleSearchChange() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSortChange() {
    setSheetOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} className="mb-6 flex items-center gap-2 sm:flex-wrap" method="GET">
      <input
        type="search"
        name="q"
        defaultValue={search}
        onChange={handleSearchChange}
        placeholder="Rechercher un produit..."
        className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-base focus:border-primary focus:outline-none sm:h-auto sm:min-w-[200px] sm:py-2 sm:text-sm"
      />

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-primary px-4 text-sm font-medium text-primary sm:hidden"
      >
        <span aria-hidden>⇅</span>
        Trier
      </button>

      {sheetOpen && (
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => setSheetOpen(false)}
          className="fixed inset-0 z-[55] bg-black/50 sm:hidden"
        />
      )}

      {/* Mobile : panneau en bas d'écran ; à partir de sm : champs en ligne */}
      <div
        className={
          sheetOpen
            ? "fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-3 rounded-t-2xl border-t border-border bg-cream p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:contents"
            : "hidden sm:contents"
        }
      >
        <div className="flex items-center justify-between sm:hidden">
          <p className="font-display text-lg font-bold">Trier les produits</p>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>
        <select
          name="tri"
          defaultValue={sort ?? "newest"}
          onChange={handleSortChange}
          aria-label="Trier les produits"
          className="h-12 rounded-full border border-border bg-surface px-4 text-base focus:border-primary focus:outline-none sm:h-auto sm:py-2 sm:text-sm"
        >
          <option value="newest">Trier : Nouveautés</option>
          <option value="price_asc">Trier : Prix croissant</option>
          <option value="price_desc">Trier : Prix décroissant</option>
        </select>
        {isFiltered && (
          <Link
            href={basePath}
            className="flex h-12 items-center justify-center rounded-full border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/10 sm:h-auto sm:border-0 sm:px-2 sm:py-2 sm:underline"
          >
            Réinitialiser
          </Link>
        )}
      </div>
    </form>
  );
}
