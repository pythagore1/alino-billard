"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ensureCartId, getCartId } from "@/lib/cart";
import { isOrderable } from "@/lib/availability";
import { cartItemInputSchema } from "@/lib/validation/order";
import { checkPublicActionRateLimit, getClientIp } from "@/lib/rate-limit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

export async function addToCart(
  productId: string,
  quantity: number,
): Promise<ActionResult<{ cartItemId: string }>> {
  const parsed = cartItemInputSchema.safeParse({ productId, quantity });
  if (!parsed.success) {
    return actionError("Quantité invalide.");
  }
  if (!(await checkPublicActionRateLimit("cart", await getClientIp(), 120))) {
    return actionError("Trop de demandes. Réessayez dans quelques minutes.");
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return actionError("Ce produit n'est plus disponible.");
  }
  if (!isOrderable(product.availability)) {
    return actionError("Ce produit n'est actuellement pas commandable.");
  }

  const cartId = await ensureCartId();

  const existingItem = await db.cartItem.findFirst({
    where: { cartId, productId, variantId: null },
  });

  const item = existingItem
    ? await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + parsed.data.quantity },
      })
    : await db.cartItem.create({
        data: { cartId, productId, quantity: parsed.data.quantity },
      });

  revalidatePath("/panier");
  return actionSuccess({ cartItemId: item.id });
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<ActionResult<null>> {
  if (quantity < 1 || quantity > 50) {
    return actionError("Quantité invalide.");
  }

  const cartId = await getCartId();
  if (!cartId) return actionError("Panier introuvable.");

  await db.cartItem.updateMany({
    where: { id: itemId, cartId },
    data: { quantity },
  });

  revalidatePath("/panier");
  return actionSuccess(null);
}

export async function removeCartItem(itemId: string): Promise<ActionResult<null>> {
  const cartId = await getCartId();
  if (!cartId) return actionError("Panier introuvable.");

  await db.cartItem.deleteMany({ where: { id: itemId, cartId } });

  revalidatePath("/panier");
  return actionSuccess(null);
}
