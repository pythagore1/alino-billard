"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bulkDeleteCategories } from "@/server/actions/categories";
import { CategoryRowActions } from "@/components/admin/category-row-actions";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  isActive: boolean;
  parent: { name: string } | null;
  _count: { products: number };
};

export function CategoriesTable({ categories }: { categories: AdminCategoryRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const allIds = useMemo(() => categories.map((c) => c.id), [categories]);
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
    if (!confirm(`Supprimer définitivement ${selected.size} catégorie(s) ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await bulkDeleteCategories(Array.from(selected));
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.data.skipped.length > 0) {
        setError(
          `${result.data.deletedCount} catégorie(s) supprimée(s). Ignorées (contiennent des produits ou sous-catégories) : ${result.data.skipped
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
          <span>{selected.size} sélectionnée(s)</span>
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
        <table className="w-full min-w-[640px] text-sm">
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
              <th className="p-3">Nom</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Produits</th>
              <th className="p-3">Statut</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(category.id)}
                    onChange={() => toggleOne(category.id)}
                    aria-label={`Sélectionner ${category.name}`}
                  />
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="inline-flex items-center gap-2 font-medium hover:underline"
                  >
                    {category.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- optimisée via cloudinaryOptimized() */
                      <img
                        src={cloudinaryOptimized(category.imageUrl, 24)}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      category.icon && <span>{category.icon}</span>
                    )}
                    {category.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">/{category.slug}</p>
                </td>
                <td className="p-3 text-muted-foreground">{category.parent?.name ?? "—"}</td>
                <td className="p-3">{category._count.products}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      category.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/admin/categories/${category.id}`} className={secondaryButtonClass}>
                      Modifier
                    </Link>
                    <CategoryRowActions id={category.id} isActive={category.isActive} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
