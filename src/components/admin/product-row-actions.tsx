"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
  toggleProductFeatured,
} from "@/server/actions/products";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui";

export function ProductRowActions({
  id,
  isActive,
  isFeatured,
}: {
  id: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer définitivement ce produit ?")) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.success) alert(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => toggleProductActive(id))}
        className={secondaryButtonClass}
      >
        {isActive ? "Désactiver" : "Activer"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => toggleProductFeatured(id))}
        className={secondaryButtonClass}
      >
        {isFeatured ? "Retirer de la une" : "Mettre en avant"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => duplicateProduct(id))}
        className={secondaryButtonClass}
      >
        Dupliquer
      </button>
      <button type="button" disabled={isPending} onClick={handleDelete} className={dangerButtonClass}>
        Supprimer
      </button>
    </div>
  );
}
