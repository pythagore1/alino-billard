"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteService, toggleServiceActive } from "@/server/actions/services";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui";

export function ServiceRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleServiceActive(id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer définitivement ce service ?")) return;
    startTransition(async () => {
      const result = await deleteService(id);
      if (!result.success) alert(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <button type="button" disabled={isPending} onClick={handleToggle} className={secondaryButtonClass}>
        {isActive ? "Désactiver" : "Activer"}
      </button>
      <button type="button" disabled={isPending} onClick={handleDelete} className={dangerButtonClass}>
        Supprimer
      </button>
    </div>
  );
}
