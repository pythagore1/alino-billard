"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory, toggleCategoryActive } from "@/server/actions/categories";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui";

export function CategoryRowActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleCategoryActive(id);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer définitivement cette catégorie ?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={secondaryButtonClass}
        >
          {isActive ? "Désactiver" : "Activer"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={dangerButtonClass}
        >
          Supprimer
        </button>
      </div>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
