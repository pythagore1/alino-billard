"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/server/actions/products";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import type { Availability } from "@/generated/prisma/enums";

const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: "Disponible",
  TO_CONFIRM: "Disponibilité à confirmer",
  ON_ORDER: "Sur commande",
  OUT_OF_STOCK: "Rupture de stock",
  DISABLED: "Désactivé",
};

type CategoryOption = { id: string; name: string; parentId: string | null };

type ExistingProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryId: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  availability: Availability;
  isFeatured: boolean;
  isActive: boolean;
  priceTiers: { minQuantity: number; unitPrice: number }[];
};

export function ProductForm({
  product,
  categories,
}: {
  product?: ExistingProduct;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice?.toString() ?? "",
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [model, setModel] = useState(product?.model ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [availability, setAvailability] = useState<Availability>(
    product?.availability ?? "TO_CONFIRM",
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [priceTiers, setPriceTiers] = useState(
    product?.priceTiers.map((t) => ({
      minQuantity: t.minQuantity.toString(),
      unitPrice: t.unitPrice.toString(),
    })) ?? [],
  );

  // Les sous-catégories sont affichées avec un préfixe pour matérialiser la
  // hiérarchie dans un simple <select> (pas de vrai arbre nécessaire ici).
  const categoryOptions = categories.map((c) => ({
    ...c,
    label: c.parentId
      ? `— ${c.name}`
      : c.name,
  }));

  function addPriceTier() {
    setPriceTiers((prev) => [...prev, { minQuantity: "", unitPrice: "" }]);
  }

  function updatePriceTier(index: number, field: "minQuantity" | "unitPrice", value: string) {
    setPriceTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function removePriceTier(index: number) {
    setPriceTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!categoryId) {
      setError("Sélectionne une catégorie.");
      return;
    }

    const input = {
      name,
      slug,
      shortDescription: shortDescription || undefined,
      description: description || undefined,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      categoryId,
      brand: brand || undefined,
      model: model || undefined,
      sku: sku || undefined,
      availability,
      isFeatured,
      isActive,
      priceTiers: priceTiers
        .filter((t) => t.minQuantity && t.unitPrice)
        .map((t) => ({ minQuantity: Number(t.minQuantity), unitPrice: Number(t.unitPrice) })),
    };

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, input)
        : await createProduct(input);

      if (!result.success) {
        const details = result.fieldErrors
          ? Object.values(result.fieldErrors).flat().join(" ")
          : "";
        setError(details ? `${result.error} — ${details}` : result.error);
        return;
      }
      if (product) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/produits/${result.data.id}`);
      }
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
        Description courte
        <input
          className={inputClass}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          maxLength={300}
        />
      </label>

      <label className={labelClass}>
        Description détaillée
        <textarea
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Prix (FCFA)
          <input
            type="number"
            min={0}
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <label className={labelClass}>
          Ancien prix (barré, optionnel)
          <input
            type="number"
            min={0}
            className={inputClass}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          SKU
          <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} />
        </label>
      </div>

      <div className={labelClass}>
        Tarif dégressif par quantité (optionnel)
        <div className="mt-1 flex flex-col gap-2">
          {priceTiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                placeholder="Quantité mini"
                className={`${inputClass} w-36`}
                value={tier.minQuantity}
                onChange={(e) => updatePriceTier(index, "minQuantity", e.target.value)}
              />
              <span className="text-sm text-muted-foreground">unités →</span>
              <input
                type="number"
                min={0}
                placeholder="Prix unitaire"
                className={`${inputClass} w-36`}
                value={tier.unitPrice}
                onChange={(e) => updatePriceTier(index, "unitPrice", e.target.value)}
              />
              <span className="text-sm text-muted-foreground">FCFA/unité</span>
              <button
                type="button"
                onClick={() => removePriceTier(index)}
                className="text-sm text-red-600 underline"
              >
                Retirer
              </button>
            </div>
          ))}
          <button type="button" onClick={addPriceTier} className={`${secondaryButtonClass} w-fit`}>
            + Ajouter un palier
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Le prix ci-dessus s&apos;applique à partir de 1 unité. Ajoute un palier pour un tarif
          réduit à partir d&apos;une quantité donnée (ex. 12 unités → 7 000 FCFA/u).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          Marque
          <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
        <label className={labelClass}>
          Modèle
          <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
      </div>

      <label className={labelClass}>
        Catégorie
        <select
          className={inputClass}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="">— Choisir —</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Disponibilité
        <select
          className={inputClass}
          value={availability}
          onChange={(e) => setAvailability(e.target.value as Availability)}
        >
          {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Mettre en avant
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Actif (visible sur la boutique)
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-primary">Modifications enregistrées ✓</p>
      )}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement..." : product ? "Enregistrer" : "Créer le produit"}
      </button>
    </form>
  );
}
