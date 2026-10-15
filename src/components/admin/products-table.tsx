"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bulkDeleteProducts } from "@/server/actions/products";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui";
import { formatPrice } from "@/lib/format";
import type { Availability } from "@/generated/prisma/enums";

const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: "Disponible",
  TO_CONFIRM: "À confirmer",
  ON_ORDER: "Sur commande",
  OUT_OF_STOCK: "Rupture",
  DISABLED: "Désactivé",
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  isActive: boolean;
  price: number;
  availability: Availability;
  category: { name: string };
};

export function ProductsTable({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const allIds = useMemo(() => products.map((p) => p.id), [products]);
  const allSelected = selected.size > 0 && selected.size === allIds.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer définitivement ${selected.size} produit(s) ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await bulkDeleteProducts(Array.from(selected));
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.data.skipped.length > 0) {
        setError(
          `${result.data.deletedCount} produit(s) supprimé(s). Ignorés (déjà dans des commandes) : ${result.data.skipped
            .map((s) => s.name)
            .join(", ")}.`,
        );
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3 text-sm">
          <span>{selected.size} sélectionné(s)</span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleBulkDelete}
            className={dangerButtonClass}
          >
            Supprimer la sélection
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className={secondaryButtonClass}
          >
            Annuler
          </button>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </th>
              <th className="p-3">Produit</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Disponibilité</th>
              <th className="p-3">Statut</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    aria-label={`Sélectionner ${product.name}`}
                  />
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/produits/${product.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                  {product.isFeatured && (
                    <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      En avant
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">/{product.slug}</p>
                </td>
                <td className="p-3 text-muted-foreground">{product.category.name}</td>
                <td className="p-3">{formatPrice(product.price)}</td>
                <td className="p-3">{AVAILABILITY_LABELS[product.availability]}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      product.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {product.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/admin/produits/${product.id}`} className={secondaryButtonClass}>
                      Modifier
                    </Link>
                    <ProductRowActions
                      id={product.id}
                      isActive={product.isActive}
                      isFeatured={product.isFeatured}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Aucun produit ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
