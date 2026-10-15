"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createService, updateService } from "@/server/actions/services";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

type PricingType = "FIXED" | "STARTING_AT" | "QUOTE_ONLY";

const PRICING_LABELS: Record<PricingType, string> = {
  FIXED: "Prix fixe",
  STARTING_AT: "À partir de",
  QUOTE_ONLY: "Devis uniquement",
};

type ExistingService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricingType: PricingType;
  price: number | null;
  durationEstimate: string | null;
  interventionZone: string | null;
  isBookable: boolean;
  isQuotable: boolean;
  isActive: boolean;
};

export function ServiceForm({ service }: { service?: ExistingService }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [pricingType, setPricingType] = useState<PricingType>(service?.pricingType ?? "FIXED");
  const [price, setPrice] = useState(service?.price?.toString() ?? "");
  const [durationEstimate, setDurationEstimate] = useState(service?.durationEstimate ?? "");
  const [interventionZone, setInterventionZone] = useState(service?.interventionZone ?? "");
  const [isBookable, setIsBookable] = useState(service?.isBookable ?? true);
  const [isQuotable, setIsQuotable] = useState(service?.isQuotable ?? true);
  const [isActive, setIsActive] = useState(service?.isActive ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input = {
      name,
      slug,
      description: description || undefined,
      pricingType,
      price: pricingType !== "QUOTE_ONLY" && price ? Number(price) : undefined,
      durationEstimate: durationEstimate || undefined,
      interventionZone: interventionZone || undefined,
      isBookable,
      isQuotable,
      isActive,
    };

    startTransition(async () => {
      const result = service
        ? await updateService(service.id, input)
        : await createService(input);

      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/admin/services");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nom
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className={labelClass}>
          Slug (généré automatiquement si vide)
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
      </div>

      <label className={labelClass}>
        Description
        <textarea
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Type de prix
          <select
            className={inputClass}
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as PricingType)}
          >
            {Object.entries(PRICING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {pricingType !== "QUOTE_ONLY" && (
          <label className={labelClass}>
            Prix (FCFA)
            <input
              type="number"
              min={0}
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        )}
        <label className={labelClass}>
          Durée estimée
          <input
            className={inputClass}
            value={durationEstimate}
            onChange={(e) => setDurationEstimate(e.target.value)}
            placeholder="ex: 2 à 4 heures"
          />
        </label>
      </div>

      <label className={labelClass}>
        Zone d&apos;intervention
        <input
          className={inputClass}
          value={interventionZone}
          onChange={(e) => setInterventionZone(e.target.value)}
          placeholder="ex: Douala, Yaoundé"
        />
      </label>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isBookable} onChange={(e) => setIsBookable(e.target.checked)} />
          Prise de rendez-vous possible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isQuotable} onChange={(e) => setIsQuotable(e.target.checked)} />
          Demande de devis possible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Actif (visible sur la boutique)
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement..." : service ? "Enregistrer" : "Créer le service"}
      </button>
    </form>
  );
}
