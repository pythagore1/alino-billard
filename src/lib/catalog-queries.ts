import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Lectures publiques du catalogue (vitrine). Toutes sont mises en cache avec le
// tag "catalog" : chaque modification faite dans l'admin (produit, catégorie,
// prix, disponibilité, mise en avant, image...) appelle updateTag("catalog")
// pour que le site reflète le changement tout de suite. La durée de vie
// ("catalog") n'est qu'un filet de sécurité.

/** Arbre catégories > sous-catégories, pour la navigation et l'accueil. */
export async function getCategoryTree() {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  return db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
      },
    },
  });
}

/**
 * Nombre de produits actifs par catégorie racine (sous-catégories comprises),
 * avec la même règle que la page d'une catégorie : un parent compte aussi les
 * produits de ses enfants.
 */
export async function getRootCategoryProductCounts() {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  const [roots, grouped] = await Promise.all([
    getCategoryTree(),
    db.product.groupBy({ by: ["categoryId"], where: { isActive: true }, _count: { _all: true } }),
  ]);
  const countByCategory = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
  return new Map(
    roots.map((root) => [
      root.id,
      [root.id, ...root.children.map((c) => c.id)].reduce((sum, id) => sum + (countByCategory.get(id) ?? 0), 0),
    ]),
  );
}

/** Produits mis en avant pour la page d'accueil. */
export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  return db.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      images: { where: { isPrimary: true }, include: { media: true } },
      category: true,
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  return db.category.findFirst({
    where: { slug, isActive: true },
    include: { parent: true, children: { where: { isActive: true }, orderBy: { position: "asc" } } },
  });
}

export type CatalogSort = "newest" | "price_asc" | "price_desc";

export type CatalogFilters = {
  categorySlug?: string;
  search?: string;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

const SORT_ORDER: Record<CatalogSort, { createdAt?: "desc"; price?: "asc" | "desc" }> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

/**
 * Liste publique du catalogue (page /catalogue et /catalogue/[categorie]).
 * Si une catégorie parente est demandée, on inclut aussi ses sous-catégories
 * — un client qui parcourt "Queues de billard" doit voir toutes les queues,
 * pas seulement celles rattachées exactement à ce nœud de l'arbre.
 */
export async function getProductsForCatalog(filters: CatalogFilters = {}) {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize ?? 12;

  let categoryIds: string[] | undefined;
  if (filters.categorySlug) {
    const category = await db.category.findFirst({
      where: { slug: filters.categorySlug, isActive: true },
      include: { children: { where: { isActive: true } } },
    });
    if (!category) return { products: [], total: 0, page, pageSize };
    categoryIds = [category.id, ...category.children.map((c) => c.id)];
  }

  const where = {
    isActive: true,
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: SORT_ORDER[filters.sort ?? "newest"],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { where: { isPrimary: true }, include: { media: true } },
        category: true,
      },
    }),
    db.product.count({ where }),
  ]);

  return { products, total, page, pageSize };
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  return db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { include: { media: true }, orderBy: { position: "asc" } },
      variants: true,
      attributes: true,
      priceTiers: { orderBy: { minQuantity: "asc" } },
      category: true,
    },
  });
}

/** Produits similaires : même catégorie, produit courant exclu. */
export async function getSimilarProducts(productId: string, categoryId: string, limit = 4) {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  const include = { images: { where: { isPrimary: true }, include: { media: true } } };
  const sameCategory = await db.product.findMany({
    where: { isActive: true, categoryId, NOT: { id: productId } },
    take: limit,
    include,
  });
  if (sameCategory.length >= limit) return sameCategory;

  // Catégorie presque vide : on complète avec les produits les plus récents
  // des autres catégories plutôt que d'afficher une seule carte.
  const others = await db.product.findMany({
    where: {
      isActive: true,
      NOT: [{ id: productId }, { id: { in: sameCategory.map((p) => p.id) } }],
    },
    orderBy: { createdAt: "desc" },
    take: limit - sameCategory.length,
    include,
  });
  return [...sameCategory, ...others];
}

/** Slugs des produits actifs, pour pré-générer leurs pages à la compilation. */
export async function getActiveProductSlugs() {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  const products = await db.product.findMany({ where: { isActive: true }, select: { slug: true } });
  return products.map((p) => p.slug);
}

/** Slugs des catégories actives (racines et sous-catégories). */
export async function getActiveCategorySlugs() {
  "use cache";
  cacheTag("catalog");
  cacheLife("catalog");

  const categories = await db.category.findMany({ where: { isActive: true }, select: { slug: true } });
  return categories.map((c) => c.slug);
}
