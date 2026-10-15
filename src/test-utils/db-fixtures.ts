import { db } from "@/lib/db";

/** Préfixe commun pour repérer/nettoyer facilement les données de test. */
export const TEST_PREFIX = "test-fixture";

export function uniqueSlug(base: string): string {
  return `${TEST_PREFIX}-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestCategory() {
  const slug = uniqueSlug("categorie");
  return db.category.create({
    data: { name: slug, slug, position: 999, isActive: true },
  });
}

export async function createTestProduct(
  categoryId: string,
  overrides: Partial<{ price: number; availability: "AVAILABLE" | "TO_CONFIRM" | "ON_ORDER" | "OUT_OF_STOCK" | "DISABLED"; isActive: boolean }> = {},
) {
  const slug = uniqueSlug("produit");
  return db.product.create({
    data: {
      name: slug,
      slug,
      price: overrides.price ?? 5000,
      categoryId,
      availability: overrides.availability ?? "AVAILABLE",
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function cleanupTestCategory(categoryId: string) {
  await db.product.deleteMany({ where: { categoryId } });
  await db.category.delete({ where: { id: categoryId } }).catch(() => {});
}
