"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addShippingRate,
  createZone,
  deleteShippingRate,
  deleteZone,
  toggleZoneActive,
} from "@/server/actions/delivery";
import { formatPrice } from "@/lib/format";
import { inputClass, dangerButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import type { DeliveryMethodType } from "@/generated/prisma/enums";

type Rate = { id: string; method: DeliveryMethodType; price: number; freeAbove: number | null };
type Zone = {
  id: string;
  name: string;
  isActive: boolean;
  rates: Rate[];
  _count: { orders: number };
};

const METHOD_LABELS: Record<string, string> = { STANDARD: "Standard", EXPRESS: "Express" };

export function DeliveryZoneManager({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newZoneName, setNewZoneName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleCreateZone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createZone(newZoneName);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNewZoneName("");
      refresh();
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleZoneActive(id);
      refresh();
    });
  }

  function handleDeleteZone(id: string) {
    if (!confirm("Supprimer cette zone de livraison ?")) return;
    startTransition(async () => {
      const result = await deleteZone(id);
      if (!result.success) alert(result.error);
      refresh();
    });
  }

  function handleAddRate(zoneId: string, form: HTMLFormElement) {
    const data = new FormData(form);
    const method = data.get("method") as "STANDARD" | "EXPRESS";
    const price = Number(data.get("price"));
    const freeAbove = data.get("freeAbove") ? Number(data.get("freeAbove")) : undefined;

    startTransition(async () => {
      const result = await addShippingRate({ zoneId, method, price, freeAbove });
      if (!result.success) {
        alert(result.error);
        return;
      }
      form.reset();
      refresh();
    });
  }

  function handleDeleteRate(id: string) {
    startTransition(async () => {
      await deleteShippingRate(id);
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreateZone} className="flex max-w-md gap-2">
        <input
          className={`${inputClass} flex-1`}
          placeholder="Nouvelle zone (ex: Bafoussam)"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          required
        />
        <button type="submit" disabled={isPending} className={primaryButtonClass}>
          Ajouter
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
        {zones.map((zone) => (
          <div key={zone.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{zone.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    zone.isActive ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted-foreground"
                  }`}
                >
                  {zone.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(zone.id)}
                  className={secondaryButtonClass}
                >
                  {zone.isActive ? "Désactiver" : "Activer"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteZone(zone.id)}
                  className={dangerButtonClass}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1">
              {zone.rates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between text-sm">
                  <span>
                    {METHOD_LABELS[rate.method]} — {formatPrice(rate.price)}
                    {rate.freeAbove ? ` (gratuit dès ${formatPrice(rate.freeAbove)})` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRate(rate.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddRate(zone.id, e.currentTarget);
              }}
              className="mt-3 flex flex-wrap items-end gap-2"
            >
              <label className="flex flex-col gap-1 text-xs">
                Mode
                <select name="method" className={inputClass} required>
                  <option value="STANDARD">Standard</option>
                  <option value="EXPRESS">Express</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Prix (FCFA)
                <input type="number" name="price" min={0} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Gratuit dès (optionnel)
                <input type="number" name="freeAbove" min={0} className={inputClass} />
              </label>
              <button type="submit" disabled={isPending} className={secondaryButtonClass}>
                Ajouter un tarif
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
