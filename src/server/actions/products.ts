"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";
import { cloudinary, createUploadSignature } from "@/lib/cloudinary";
import { productSchema, priceTierSchema, type PriceTierInput } from "@/lib/validation/catalog";
import { actionError, actionSuccess, BusinessError, type ActionResult } from "@/lib/errors";
import type { Availability } from "@/generated/prisma/enums";

// Démo ALINO : le catalogue est réservé au SUPER_ADMIN (maintenance). Les ADMIN ne gèrent que les commandes.
const CAN_MANAGE_CATALOG = ["SUPER_ADMIN"] as const;

export type ProductAdminSort =
  | "updated_desc"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc";

const PRODUCT_ADMIN_ORDER_BY = {
  updated_desc: { updatedAt: "desc" },
  name_asc: { name: "asc" },
  name_desc: { name: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
} as const satisfies Record<ProductAdminSort, Record<string, "asc" | "desc">>;

export type ProductAdminFilters = {
  search?: string;
  categoryId?: string;
  availability?: Availability;
  isActive?: boolean;
  sort?: ProductAdminSort;
};

export async function listProductsForAdmin(filters: ProductAdminFilters = {}) {
  await requireRole([...CAN_MANAGE_CATALOG]);

  return db.product.findMany({
    where: {
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { sku: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.availability ? { availability: filters.availability } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    orderBy: PRODUCT_ADMIN_ORDER_BY[filters.sort ?? "updated_desc"],
    include: {
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, include: { media: true }, take: 1 },
    },
  });
}

export async function getProductForAdmin(id: string) {
  await requireRole([...CAN_MANAGE_CATALOG]);
  return db.product.findUnique({
    where: { id },
    include: {
      images: { include: { media: true }, orderBy: { position: "asc" } },
      variants: true,
      attributes: true,
      priceTiers: { orderBy: { minQuantity: "asc" } },
      category: { select: { slug: true } },
    },
  });
}

type ProductFormInput = {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  brand?: string;
  model?: string;
  sku?: string;
  availability: Availability;
  isFeatured: boolean;
  isActive: boolean;
  priceTiers?: PriceTierInput[];
};

/** Valide les paliers et rejette les doublons de seuil (minQuantity). */
function parsePriceTiers(tiers: PriceTierInput[] | undefined): PriceTierInput[] | { error: string } {
  if (!tiers || tiers.length === 0) return [];
  for (const tier of tiers) {
    const parsed = priceTierSchema.safeParse(tier);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Palier de prix invalide." };
    }
  }
  const thresholds = new Set(tiers.map((t) => t.minQuantity));
  if (thresholds.size !== tiers.length) {
    return { error: "Deux paliers ne peuvent pas démarrer à la même quantité." };
  }
  return tiers;
}

export async function createProduct(
  input: ProductFormInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const parsed = productSchema.safeParse({ ...input, slug });
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const slugTaken = await db.product.findUnique({ where: { slug } });
  if (slugTaken) return actionError("Ce slug est déjà utilisé par un autre produit.");

  const tiers = parsePriceTiers(input.priceTiers);
  if ("error" in tiers) return actionError(tiers.error);

  const product = await db.product.create({
    data: {
      ...parsed.data,
      availabilityCheckedAt: new Date(),
      priceTiers: { create: tiers },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    after: product,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ id: product.id });
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return actionError("Produit introuvable.");

  const slug = input.slug?.trim() ? slugify(input.slug) : existing.slug;
  const parsed = productSchema.safeParse({ ...input, slug });
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const slugTaken = await db.product.findFirst({ where: { slug, NOT: { id } } });
  if (slugTaken) return actionError("Ce slug est déjà utilisé par un autre produit.");

  const tiers = parsePriceTiers(input.priceTiers);
  if ("error" in tiers) return actionError(tiers.error);

  // Si la disponibilité change, on horodate la vérification : l'admin voit
  // toujours quand la dispo a été confirmée pour la dernière fois auprès du
  // grossiste (cf. cahier des charges — la dispo n'est jamais une vérité
  // temps réel automatique, c'est une donnée saisie par un humain).
  const availabilityChanged = parsed.data.availability !== existing.availability;

  const product = await db.product.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(availabilityChanged ? { availabilityCheckedAt: new Date() } : {}),
      priceTiers: { deleteMany: {}, create: tiers },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.update",
    entityType: "Product",
    entityId: id,
    before: existing,
    after: product,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  revalidatePath(`/produit/${product.slug}`);
  return actionSuccess({ id: product.id });
}

export async function toggleProductActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return actionError("Produit introuvable.");

  const product = await db.product.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    userId: session.user.id,
    action: product.isActive ? "product.activate" : "product.deactivate",
    entityType: "Product",
    entityId: id,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ isActive: product.isActive });
}

export async function toggleProductFeatured(id: string): Promise<ActionResult<{ isFeatured: boolean }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return actionError("Produit introuvable.");

  const product = await db.product.update({
    where: { id },
    data: { isFeatured: !existing.isFeatured },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.toggleFeatured",
    entityType: "Product",
    entityId: id,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ isFeatured: product.isFeatured });
}

export async function updateProductAvailability(
  id: string,
  availability: Availability,
): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return actionError("Produit introuvable.");

  await db.product.update({
    where: { id },
    data: { availability, availabilityCheckedAt: new Date() },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.availability",
    entityType: "Product",
    entityId: id,
    before: { availability: existing.availability },
    after: { availability },
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess(null);
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const source = await db.product.findUnique({
    where: { id },
    include: { images: true, variants: true, attributes: true },
  });
  if (!source) return actionError("Produit introuvable.");

  let slug = `${source.slug}-copie`;
  let suffix = 2;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${source.slug}-copie-${suffix}`;
    suffix += 1;
  }

  const copy = await db.product.create({
    data: {
      name: `${source.name} (copie)`,
      slug,
      shortDescription: source.shortDescription,
      description: source.description,
      price: source.price,
      compareAtPrice: source.compareAtPrice,
      categoryId: source.categoryId,
      brand: source.brand,
      model: source.model,
      availability: "TO_CONFIRM",
      isFeatured: false,
      isActive: false, // une copie démarre désactivée, à valider avant publication
      variants: {
        create: source.variants.map((v) => ({
          label: v.label,
          value: v.value,
          priceDelta: v.priceDelta,
          skuSuffix: v.skuSuffix,
          availability: v.availability,
        })),
      },
      attributes: {
        create: source.attributes.map((a) => ({ name: a.name, value: a.value })),
      },
      images: {
        create: source.images.map((img) => ({
          mediaId: img.mediaId,
          position: img.position,
          isPrimary: img.isPrimary,
        })),
      },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.duplicate",
    entityType: "Product",
    entityId: copy.id,
    before: { sourceId: source.id },
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ id: copy.id });
}

export async function deleteProduct(id: string): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, cartItems: true } } },
  });
  if (!existing) return actionError("Produit introuvable.");

  try {
    if (existing._count.orderItems > 0) {
      throw new BusinessError(
        "Impossible de supprimer un produit déjà présent dans des commandes. Désactive-le plutôt pour le retirer de la vente.",
      );
    }

    await db.product.delete({ where: { id } });
  } catch (error) {
    if (error instanceof BusinessError) return actionError(error.message);
    throw error;
  }

  await logAudit({
    userId: session.user.id,
    action: "product.delete",
    entityType: "Product",
    entityId: id,
    before: existing,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess(null);
}

export async function bulkDeleteProducts(
  ids: string[],
): Promise<ActionResult<{ deletedCount: number; skipped: { name: string; reason: string }[] }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);
  if (ids.length === 0) return actionError("Aucun produit sélectionné.");

  const products = await db.product.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { orderItems: true } } },
  });

  const deletable = products.filter((p) => p._count.orderItems === 0);
  const skipped = products
    .filter((p) => p._count.orderItems > 0)
    .map((p) => ({ name: p.name, reason: "présent dans des commandes" }));

  if (deletable.length > 0) {
    await db.product.deleteMany({ where: { id: { in: deletable.map((p) => p.id) } } });
    for (const p of deletable) {
      await logAudit({
        userId: session.user.id,
        action: "product.delete",
        entityType: "Product",
        entityId: p.id,
        before: p,
      });
    }
  }

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ deletedCount: deletable.length, skipped });
}

/**
 * Ajout d'image par URL — option secondaire pour réutiliser une image déjà
 * hébergée ailleurs. Le chemin principal est désormais l'upload direct vers
 * Cloudinary (voir attachUploadedProductImage), avec optimisation automatique.
 */
export async function addProductImageByUrl(
  productId: string,
  url: string,
  altText?: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  if (!isValidHttpUrl(url)) return actionError("URL d'image invalide.");

  const existingCount = await db.productImage.count({ where: { productId } });

  const media = await db.media.create({
    data: {
      type: "IMAGE",
      url,
      publicId: `manual/${productId}/${Date.now()}`,
      altText,
    },
  });

  const image = await db.productImage.create({
    data: {
      productId,
      mediaId: media.id,
      position: existingCount,
      isPrimary: existingCount === 0,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.image.add",
    entityType: "Product",
    entityId: productId,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ id: image.id });
}

/**
 * Signature d'upload Cloudinary — le fichier est envoyé directement du
 * navigateur vers Cloudinary. Un dossier par catégorie puis par produit
 * (slugs lisibles) plutôt qu'un seul dossier fourre-tout : la structure
 * Cloudinary reflète directement le catalogue, facile à parcourir
 * manuellement dans le tableau de bord une fois rempli (cahier des charges
 * section 23 — médiathèque organisée par dossiers).
 */
export async function getProductMediaUploadSignature(categorySlug: string, productSlug: string) {
  await requireRole([...CAN_MANAGE_CATALOG]);
  // Les slugs viennent du navigateur : on empêche de sortir du dossier prévu.
  if (!SLUG_PATTERN.test(categorySlug) || !SLUG_PATTERN.test(productSlug)) {
    throw new Error("Identifiant de dossier invalide.");
  }
  return createUploadSignature(`alino-billard/products/${categorySlug}/${productSlug}`);
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/i;

type UploadedMedia = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: "image" | "video";
  altText?: string;
};

/** Enregistre un média déjà uploadé sur Cloudinary et l'attache au produit. */
export async function attachUploadedProductImage(
  productId: string,
  upload: UploadedMedia,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  // Le navigateur renvoie ces valeurs : on n'accepte que ce qui vient bien de
  // notre dossier Cloudinary (sinon on pourrait attacher n'importe quelle
  // adresse, ou faire supprimer plus tard un fichier qui n'est pas à nous).
  if (
    typeof upload.url !== "string" ||
    !upload.url.startsWith("https://res.cloudinary.com/") ||
    typeof upload.publicId !== "string" ||
    !upload.publicId.startsWith("alino-billard/") ||
    upload.publicId.includes("..")
  ) {
    return actionError("Média invalide.");
  }

  const existingCount = await db.productImage.count({ where: { productId } });

  const media = await db.media.create({
    data: {
      type: upload.resourceType === "video" ? "VIDEO" : "IMAGE",
      url: upload.url,
      publicId: upload.publicId,
      altText: upload.altText,
      width: upload.width,
      height: upload.height,
      duration: upload.duration,
    },
  });

  const image = await db.productImage.create({
    data: {
      productId,
      mediaId: media.id,
      position: existingCount,
      isPrimary: existingCount === 0,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "product.image.upload",
    entityType: "Product",
    entityId: productId,
  });

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess({ id: image.id });
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
): Promise<ActionResult<null>> {
  await requireRole([...CAN_MANAGE_CATALOG]);

  const target = await db.productImage.findFirst({ where: { id: imageId, productId }, select: { id: true } });
  if (!target) return actionError("Image introuvable pour ce produit.");

  await db.$transaction([
    db.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    db.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess(null);
}

export async function removeProductImage(imageId: string): Promise<ActionResult<null>> {
  await requireRole([...CAN_MANAGE_CATALOG]);

  const image = await db.productImage.findUnique({ where: { id: imageId }, include: { media: true } });
  await db.productImage.delete({ where: { id: imageId } });

  // Purge côté Cloudinary si c'est bien un média qu'on y a uploadé (pas une
  // simple URL externe collée via l'ancien flux transitoire). On ne bloque
  // jamais la suppression si Cloudinary échoue — au pire un fichier orphelin.
  if (image && image.media.publicId.startsWith("alino-billard/")) {
    try {
      await cloudinary.uploader.destroy(image.media.publicId, {
        resource_type: image.media.type === "VIDEO" ? "video" : "image",
      });
    } catch (error) {
      console.error("Échec de la suppression Cloudinary", error);
    }
  }

  revalidatePath("/admin/produits");
  updateTag("catalog");
  return actionSuccess(null);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
