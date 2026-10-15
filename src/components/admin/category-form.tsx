"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  getCategoryImageUploadSignature,
  updateCategory,
} from "@/server/actions/categories";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";

type CategoryOption = { id: string; name: string; parentId: string | null };

type ExistingCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

type CloudinaryUploadResponse = { secure_url: string };

async function uploadToCloudinary(
  file: File,
  signature: {
    signature: string;
    timestamp: number;
    folder: string;
    allowedFormats?: string;
    apiKey?: string;
    cloudName?: string;
  },
): Promise<CloudinaryUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey ?? "");
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);
  if (signature.allowedFormats) form.append("allowed_formats", signature.allowedFormats);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!response.ok) throw new Error(`Échec de l'upload Cloudinary : ${await response.text()}`);
  return response.json();
}

export function CategoryForm({
  category,
  allCategories,
}: {
  category?: ExistingCategory;
  allCategories: CategoryOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const signature = await getCategoryImageUploadSignature();
      const uploaded = await uploadToCloudinary(file, signature);
      setImageUrl(uploaded.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Seules les catégories "racine" peuvent servir de parent : le schéma
  // n'autorise qu'un seul niveau de sous-catégories (cf. section 6 du
  // cahier des charges — catégorie > sous-catégorie, pas plus profond).
  const parentOptions = allCategories.filter(
    (c) => c.parentId === null && c.id !== category?.id,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input = {
      name,
      slug,
      parentId: parentId || null,
      icon: icon || undefined,
      imageUrl: imageUrl || undefined,
      isActive,
    };

    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, input)
        : await createCategory(input);

      if (!result.success) {
        const details = result.fieldErrors
          ? Object.values(result.fieldErrors).flat().join(" ")
          : "";
        setError(details ? `${result.error} — ${details}` : result.error);
        return;
      }
      router.push("/admin/categories");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <label className={labelClass}>
        Nom
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        Slug (laisser vide pour le générer automatiquement)
        <input
          className={inputClass}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={name ? undefined : "ex: queues-de-jeu"}
        />
      </label>

      <label className={labelClass}>
        Catégorie parente (laisser vide pour une catégorie principale)
        <select
          className={inputClass}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">— Catégorie principale —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Icône (un emoji, optionnel — utilisé si aucune image n&apos;est définie)
        <input
          className={inputClass}
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={8}
          placeholder="🎱"
        />
      </label>

      <div className={labelClass}>
        Image (optionnelle, remplace l&apos;icône sur la page d&apos;accueil)
        <div className="mt-1 flex items-center gap-3">
          {imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element -- optimisée via cloudinaryOptimized() */
            <img src={cloudinaryOptimized(imageUrl, 64)} alt="" className="h-16 w-16 rounded border border-border object-cover" />
          )}
          <div className="flex flex-col gap-1">
            <label className="w-fit">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading}
                className="hidden"
              />
              <span className={secondaryButtonClass}>
                {isUploading ? "Envoi en cours..." : imageUrl ? "Remplacer" : "Importer une image"}
              </span>
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-left text-xs text-red-600 underline"
              >
                Retirer l&apos;image
              </button>
            )}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Catégorie active (visible sur la boutique)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement..." : category ? "Enregistrer" : "Créer la catégorie"}
      </button>
    </form>
  );
}
