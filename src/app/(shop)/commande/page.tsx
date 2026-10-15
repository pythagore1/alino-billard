import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCartWithItems } from "@/lib/cart";
import { getCheckoutDeliveryOptions } from "@/server/actions/orders";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getCurrentUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Commande" };

export default async function CheckoutPage() {
  const cart = await getCartWithItems();
  if (!cart || cart.items.length === 0) {
    redirect("/panier");
  }

  // Client connecté : on préremplit ses coordonnées (modifiables).
  const sessionUser = await getCurrentUser();
  const profile =
    sessionUser?.role === "CUSTOMER"
      ? await db.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, phone: true } })
      : null;

  const deliveryOptions = await getCheckoutDeliveryOptions();
  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-44 sm:py-10 sm:pb-10">
      <h1 className="mb-6 text-2xl font-semibold">Finaliser la commande</h1>
      <CheckoutForm
        {...deliveryOptions}
        subtotal={subtotal}
        defaultName={profile?.name ?? ""}
        defaultPhone={profile?.phone ?? ""}
      />
    </div>
  );
}
