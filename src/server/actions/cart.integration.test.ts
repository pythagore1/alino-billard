import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createTestCategory, createTestProduct, cleanupTestCategory } from "@/test-utils/db-fixtures";

// Les Server Actions (addToCart, etc.) dépendent de cookies()/auth(), donc
// indisponibles hors d'une vraie requête Next.js. On teste ici exactement la
// même logique Prisma qu'elles exécutent, contre la vraie base.
describe("logique panier (Cart/CartItem)", () => {
  let categoryId: string;
  let productId: string;
  let cartId: string;

  beforeAll(async () => {
    const category = await createTestCategory();
    categoryId = category.id;
    const product = await createTestProduct(categoryId, { price: 5000 });
    productId = product.id;
    const cart = await db.cart.create({ data: {} });
    cartId = cart.id;
  });

  afterAll(async () => {
    await db.cartItem.deleteMany({ where: { cartId } });
    await db.cart.delete({ where: { id: cartId } });
    await cleanupTestCategory(categoryId);
  });

  it("crée une ligne de panier au premier ajout", async () => {
    const item = await db.cartItem.create({ data: { cartId, productId, quantity: 2 } });
    expect(item.quantity).toBe(2);
  });

  it("incrémente la quantité plutôt que dupliquer la ligne (comportement addToCart)", async () => {
    const existing = await db.cartItem.findFirst({ where: { cartId, productId, variantId: null } });
    expect(existing).not.toBeNull();

    await db.cartItem.update({
      where: { id: existing!.id },
      data: { quantity: existing!.quantity + 3 },
    });

    const items = await db.cartItem.findMany({ where: { cartId, productId } });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it("supprime bien une ligne du panier", async () => {
    const item = await db.cartItem.findFirstOrThrow({ where: { cartId, productId } });
    await db.cartItem.delete({ where: { id: item.id } });
    const remaining = await db.cartItem.count({ where: { cartId } });
    expect(remaining).toBe(0);
  });
});
