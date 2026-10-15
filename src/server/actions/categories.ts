"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";
import { createUploadSignature } from "@/lib/cloudinary";
import { categorySchema } from "@/lib/validation/catalog";
import { sortCategoriesHierarchically } from "@/lib/category-tree";
import { actionError, actionSuccess, BusinessError, type ActionResult } from "@/lib/errors";

const CAN_MANAGE_CATALOG = ["ADMIN", "SUPER_ADMIN"] as const;

export type CategoryAdminSort = "hierarchy" | "name_asc" | "name_desc" | "products_desc";

export type CategoryAdminFilters = {
  search?: string;
  sort?: CategoryAdminSort;
};

/** Liste à plat pour le tableau admin, catégories inactives incluses. */
export async function listCategoriesForAdmin(filters: CategoryAdminFilters = {}) {
  await requireRole([...CAN_MANAGE_CATALOG]);

  const categories = await db.category.findMany({
    where: filters.search
      ? { name: { contains: filters.search, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
  });

  switch (filters.sort) {
    case "name_desc":
      return [...categories].sort((a, b) => b.name.localeCompare(a.name));
    case "products_desc":
      return [...categories].sort((a, b) => b._count.products - a._count.products);
    case "name_asc":
      return categories;
    case "hierarchy":
    default:
      // Une recherche par nom peut exclure le parent d'un résultat : le
      // regroupement hiérarchique n'a de sens que sur la liste complète.
      return filters.search ? categories : sortCategoriesHierarchically(categories);
  }
}

export async function getCategoryForAdmin(id: string) {
  await requireRole([...CAN_MANAGE_CATALOG]);
  return db.category.findUnique({ where: { id } });
}

export async function getAllCategoriesForSelect() {
  await requireRole([...CAN_MANAGE_CATALOG]);
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, parentId: true },
  });

  // Tri hiérarchique (parent suivi immédiatement de ses enfants) plutôt
  // qu'alphabétique à plat : dans un <select> à plat, une sous-catégorie
  // triée loin de son parent est facile à confondre avec une autre au
  // moment de choisir/vérifier la catégorie d'un produit.
  return sortCategoriesHierarchically(categories);
}

/** Signature d'upload pour l'illustration d'une catégorie (une seule image, pas de galerie). */
export async function getCategoryImageUploadSignature() {
  await requireRole([...CAN_MANAGE_CATALOG]);
  return createUploadSignature("alino-billard/categories");
}

type CategoryFormInput = {
  name: string;
  slug?: string;
  parentId?: string | null;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
};

export async function createCategory(
  input: CategoryFormInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const parsed = categorySchema.safeParse({ ...input, slug, position: 0 });
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const slugTaken = await db.category.findUnique({ where: { slug } });
  if (slugTaken) {
    return actionError("Ce slug est déjà utilisé par une autre catégorie.");
  }

  const siblingsCount = await db.category.count({
    where: { parentId: parsed.data.parentId ?? null },
  });

  const category = await db.category.create({
    data: { ...parsed.data, position: siblingsCount },
  });

  await logAudit({
    userId: session.user.id,
    action: "category.create",
    entityType: "Category",
    entityId: category.id,
    after: category,
  });

  revalidatePath("/admin/categories");
  updateTag("catalog");
  return actionSuccess({ id: category.id });
}

export async function updateCategory(
  id: string,
  input: CategoryFormInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return actionError("Catégorie introuvable.");

  const slug = input.slug?.trim() ? slugify(input.slug) : existing.slug;
  const parsed = categorySchema.safeParse({
    ...input,
    slug,
    position: existing.position,
  });
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.parentId === id) {
    return actionError("Une catégorie ne peut pas être sa propre catégorie parente.");
  }

  const slugTaken = await db.category.findFirst({
    where: { slug, NOT: { id } },
  });
  if (slugTaken) {
    return actionError("Ce slug est déjà utilisé par une autre catégorie.");
  }

  const category = await db.category.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    userId: session.user.id,
    action: "category.update",
    entityType: "Category",
    entityId: id,
    before: existing,
    after: category,
  });

  revalidatePath("/admin/categories");
  updateTag("catalog");
  return actionSuccess({ id: category.id });
}

export async function toggleCategoryActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return actionError("Catégorie introuvable.");

  const category = await db.category.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    userId: session.user.id,
    action: category.isActive ? "category.activate" : "category.deactivate",
    entityType: "Category",
    entityId: id,
  });

  revalidatePath("/admin/categories");
  updateTag("catalog");
  return actionSuccess({ isActive: category.isActive });
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) return actionError("Catégorie introuvable.");

  try {
    if (existing._count.products > 0 || existing._count.children > 0) {
      throw new BusinessError(
        "Impossible de supprimer une catégorie contenant des produits ou des sous-catégories. Désactive-la à la place, ou déplace/supprime son contenu d'abord.",
      );
    }

    await db.category.delete({ where: { id } });
  } catch (error) {
    if (error instanceof BusinessError) return actionError(error.message);
    throw error;
  }

  await logAudit({
    userId: session.user.id,
    action: "category.delete",
    entityType: "Category",
    entityId: id,
    before: existing,
  });

  revalidatePath("/admin/categories");
  updateTag("catalog");
  return actionSuccess(null);
}

export async function bulkDeleteCategories(
  ids: string[],
): Promise<ActionResult<{ deletedCount: number; skipped: { name: string; reason: string }[] }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);
  if (ids.length === 0) return actionError("Aucune catégorie sélectionnée.");

  const categories = await db.category.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { products: true, children: true } } },
  });

  const deletable = categories.filter(
    (c) => c._count.products === 0 && c._count.children === 0,
  );
  const skipped = categories
    .filter((c) => c._count.products > 0 || c._count.children > 0)
    .map((c) => ({
      name: c.name,
      reason: "contient des produits ou sous-catégories",
    }));

  if (deletable.length > 0) {
    await db.category.deleteMany({ where: { id: { in: deletable.map((c) => c.id) } } });
    for (const c of deletable) {
      await logAudit({
        userId: session.user.id,
        action: "category.delete",
        entityType: "Category",
        entityId: c.id,
        before: c,
      });
    }
  }

  revalidatePath("/admin/categories");
  updateTag("catalog");
  return actionSuccess({ deletedCount: deletable.length, skipped });
}
