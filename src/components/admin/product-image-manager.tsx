"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProductImageByUrl,
  attachUploadedProductImage,
  getProductMediaUploadSignature,
  removeProductImage,
  setPrimaryProductImage,
} from "@/server/actions/products";
import { inputClass, secondaryButtonClass } from "@/lib/ui";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";
import type { MediaType } from "@/generated/prisma/enums";

type ProductImage = {
  id: string;
  isPrimary: boolean;
  media: { url: string; altText: string | null; type: MediaType };
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  duration?: number;
  resource_type: "image" | "video";
};

// Garde-fou d'expérience utilisateur uniquement (évite d'attendre une longue
// upload pour un fichier énorme) — la vraie limite de poids vient du plan
// Cloudinary souscrit, pas de ce contrôle client qui reste contournable.
const CLIENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 Mo

/** Upload direct navigateur -> Cloudinary via une signature générée côté serveur. */
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
  // Doit correspondre EXACTEMENT à la valeur signée côté serveur, sinon
  // Cloudinary rejette la requête (signature invalide) — c'est justement ce
  // qui empêche un client de la modifier pour contourner la restriction de
  // format (testé : un PDF envoyé avec ce garde-fou est bien rejeté par
  // Cloudinary avec "Image file format pdf not allowed").
  if (signature.allowedFormats) form.append("allowed_formats", signature.allowedFormats);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Échec de l'upload Cloudinary : ${body}`);
  }

  return response.json();
}

export function ProductImageManager({
  productId,
  productSlug,
  categorySlug,
  images,
}: {
  productId: string;
  productSlug: string;
  categorySlug: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);

    const tooLarge = Array.from(files).find((f) => f.size > CLIENT_MAX_FILE_SIZE_BYTES);
    if (tooLarge) {
      setError(`"${tooLarge.name}" dépasse la taille maximale de 25 Mo.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const signature = await getProductMediaUploadSignature(categorySlug, productSlug);
        const uploaded = await uploadToCloudinary(file, signature);
        const result = await attachUploadedProductImage(productId, {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          width: uploaded.width,
          height: uploaded.height,
          duration: uploaded.duration,
          resourceType: uploaded.resource_type,
        });
        if (!result.success) throw new Error(result.error);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAddByUrl(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addProductImageByUrl(productId, url);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setUrl("");
      router.refresh();
    });
  }

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      await setPrimaryProductImage(productId, imageId);
      router.refresh();
    });
  }

  function handleRemove(imageId: string) {
    if (!confirm("Retirer cette image du produit ?")) return;
    startTransition(async () => {
      await removeProductImage(imageId);
      router.refresh();
    });
  }

  const busy = isPending || isUploading;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative w-28 overflow-hidden rounded border border-border"
          >
            {img.media.type === "VIDEO" ? (
              <div className="flex h-28 w-28 items-center justify-center bg-ink text-2xl text-ink-foreground">
                ▶
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- optimisée via cloudinaryOptimized()
              <img
                src={cloudinaryOptimized(img.media.url, 112)}
                alt={img.media.altText ?? ""}
                className="h-28 w-28 object-cover"
              />
            )}
            <div className="flex flex-col gap-1 p-1">
              {img.isPrimary ? (
                <span className="rounded bg-primary/10 px-1 py-0.5 text-center text-[10px] text-primary">
                  Image principale
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img.id)}
                  disabled={busy}
                  className="text-[10px] underline"
                >
                  Définir principale
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={busy}
                className="text-[10px] text-red-600 underline"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="w-fit">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            disabled={busy}
            className="hidden"
          />
          <span className={secondaryButtonClass}>
            {isUploading ? "Envoi en cours..." : "Importer des images / vidéos"}
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          Optimisation automatique (formats modernes, tailles multiples,
          miniatures) via Cloudinary.
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">
          Ou coller l&apos;URL d&apos;une image déjà en ligne
        </summary>
        <form onSubmit={handleAddByUrl} className="mt-2 flex max-w-lg gap-2">
          <input
            type="url"
            required
            placeholder="https://..."
            className={`${inputClass} flex-1`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" disabled={busy} className={secondaryButtonClass}>
            Ajouter
          </button>
        </form>
      </details>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
