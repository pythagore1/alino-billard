import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/config";

const CART_COOKIE = "alino_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

/**
 * Lecture seule : utilisable depuis un Server Component (page panier, badge
 * du header). Ne crée jamais de panier — un panier n'existe qu'à partir du
 * premier "Ajouter au panier", qui passe par une Server Action.
 */
export async function getCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value ?? null;
}

/**
 * Crée le panier si besoin et pose le cookie — uniquement appelable depuis
 * une Server Action ou un Route Handler (Next.js interdit l'écriture de
 * cookies pendant le rendu d'un Server Component).
 */
export async function ensureCartId(): Promise<string> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(CART_COOKIE)?.value;

  if (existingId) {
    const existing = await db.cart.findUnique({ where: { id: existingId } });
    if (existing) return existing.id;
  }

  const session = await auth();
  const cart = await db.cart.create({ data: { userId: session?.user?.id ?? null } });

  cookieStore.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });

  return cart.id;
}

export async function getCartWithItems() {
  const cartId = await getCartId();
  if (!cartId) return null;

  return db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, include: { media: true }, take: 1 },
              priceTiers: { orderBy: { minQuantity: "asc" } },
            },
          },
        },
      },
    },
  });
}

export async function getCartItemCount(): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) return 0;
  const result = await db.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
