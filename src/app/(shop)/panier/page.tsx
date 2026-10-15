import type { Metadata } from "next";
import Link from "next/link";
import { getCartWithItems } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { getLineTotal } from "@/lib/pricing";
import { getSiteSettings } from "@/lib/site-settings";
import { CartItemRow } from "@/components/shop/cart-item-row";
import { primaryButtonClass } from "@/lib/ui";

export const metadata: Metadata = { title: "Panier" };

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCartWithItems(), getSiteSettings()]);
  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + getLineTotal(item.product.price, item.product.priceTiers, item.quantity),
    0,
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Votre panier est vide</h1>
        <Link href="/catalogue" className={primaryButtonClass}>
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-32 sm:py-10 sm:pb-10">
      <h1 className="mb-6 text-2xl font-semibold">Mon panier</h1>

      <div className="rounded-lg border border-border bg-surface px-4">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>

      <Link href="/catalogue" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
        ← Continuer mes achats
      </Link>

      <ul className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
        <li>
          <strong className="font-semibold text-foreground">Yaoundé :</strong> livraison standard, express ou
          retrait ; paiement à la livraison ou par Mobile Money.
        </li>
        <li>
          <strong className="font-semibold text-foreground">Autres villes :</strong> expédition ({settings.expeditionFeePercent} % du
          montant de la commande) ; paiement par Mobile Money.
        </li>
      </ul>

      {/* Mobile : total + bouton collés au-dessus de la navigation */}
      <div data-sticky-cart className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-border bg-cream px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:hidden">
        <div>
          <p className="text-xs text-muted-foreground">Sous-total</p>
          <p className="text-lg font-semibold">{formatPrice(subtotal)}</p>
        </div>
        <Link href="/commande" className={`${primaryButtonClass} min-h-11 flex-1 text-center`}>
          Passer commande
        </Link>
      </div>

      <div className="hidden sm:block">
        <div className="mt-6 flex items-center justify-between">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="text-xl font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Frais de livraison calculés à l&apos;étape suivante.
        </p>

        <Link href="/commande" className={`${primaryButtonClass} mt-6 block text-center`}>
          Passer commande
        </Link>
      </div>
      <p className="mt-3 text-sm text-muted-foreground sm:hidden">
        Frais de livraison calculés à l&apos;étape suivante.
      </p>
    </div>
  );
}
