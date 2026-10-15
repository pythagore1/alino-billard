"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeCartItem, updateCartItemQuantity } from "@/server/actions/cart";
import { formatPrice } from "@/lib/format";
import { getUnitPrice, getLineTotal } from "@/lib/pricing";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";

type CartItemData = {
  id: string;
  quantity: number;
  product: {
    slug: string;
    name: string;
    price: number;
    images: { media: { url: string; altText: string | null } }[];
    priceTiers: { minQuantity: number; unitPrice: number }[];
  };
};

export function CartItemRow({ item }: { item: CartItemData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const image = item.product.images[0]?.media;
  const unitPrice = getUnitPrice(item.product.price, item.product.priceTiers, item.quantity);

  // Saisie libre dans le champ, validée seulement à la perte de focus / sur
  // Entrée — sinon chaque caractère tapé déclencherait un aller-retour
  // serveur et un router.refresh() en pleine frappe. Resynchronisé pendant
  // le rendu (pas via useEffect) si item.quantity change de l'extérieur —
  // voir https://react.dev/learn/you-might-not-need-an-effect.
  const [prevQuantity, setPrevQuantity] = useState(item.quantity);
  const [quantityInput, setQuantityInput] = useState(String(item.quantity));
  if (item.quantity !== prevQuantity) {
    setPrevQuantity(item.quantity);
    setQuantityInput(String(item.quantity));
  }

  function handleQuantityChange(quantity: number) {
    if (quantity < 1) return;
    startTransition(async () => {
      await updateCartItemQuantity(item.id, quantity);
      router.refresh();
    });
  }

  function commitQuantityInput() {
    const parsed = Number.parseInt(quantityInput, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : item.quantity;
    setQuantityInput(String(clamped));
    if (clamped !== item.quantity) handleQuantityChange(clamped);
  }

  function handleRemove() {
    startTransition(async () => {
      await removeCartItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border py-4 last:border-0 sm:flex-nowrap sm:gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes
          <img
            src={cloudinaryOptimized(image.url, 128)}
            alt={image.altText ?? item.product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🎱</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium">{item.product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(unitPrice)}
          {unitPrice < item.product.price && (
            <span className="ml-1 text-primary">(tarif dégressif)</span>
          )}
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-3 sm:contents">
        <div className="flex items-center rounded border border-border bg-surface">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuantityChange(item.quantity - 1)}
            aria-label="Diminuer la quantité"
            className="flex h-11 w-11 items-center justify-center rounded-l text-lg hover:bg-surface-muted active:bg-border disabled:opacity-50 disabled:hover:bg-transparent sm:h-auto sm:w-auto sm:px-2 sm:py-1 sm:text-base"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            disabled={isPending}
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            onBlur={commitQuantityInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitQuantityInput();
                e.currentTarget.blur();
              }
            }}
            aria-label="Quantité"
            className="h-11 w-12 border-x border-border bg-surface text-center text-base text-foreground sm:h-auto sm:w-10 sm:py-1 sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuantityChange(item.quantity + 1)}
            aria-label="Augmenter la quantité"
            className="flex h-11 w-11 items-center justify-center rounded-r text-lg hover:bg-surface-muted active:bg-border disabled:opacity-50 disabled:hover:bg-transparent sm:h-auto sm:w-auto sm:px-2 sm:py-1 sm:text-base"
          >
            +
          </button>
        </div>

        <p className="font-medium sm:w-24 sm:text-right">
          {formatPrice(getLineTotal(item.product.price, item.product.priceTiers, item.quantity))}
        </p>

        <button
          type="button"
          disabled={isPending}
          onClick={handleRemove}
          className="flex min-h-11 items-center px-1 text-sm text-red-600 hover:underline sm:min-h-0 sm:px-0"
        >
          Retirer
        </button>
      </div>
    </div>
  );
}
