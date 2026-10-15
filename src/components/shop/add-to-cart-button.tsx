"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/server/actions/cart";
import { primaryButtonClass } from "@/lib/ui";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  // État "pending" géré à la main, comme QuickAddButton : dans un
  // startTransition, router.refresh() retenait aussi le message de
  // confirmation jusqu'à la fin du rafraîchissement de la page, si bien que
  // « Ajouté au panier » ne s'affichait pas.
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function handleQuantityInput(value: string) {
    if (value === "") {
      setQuantity(1);
      return;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      setQuantity(Math.min(50, Math.max(1, parsed)));
    }
  }

  async function handleAdd() {
    setError(null);
    setAdded(false);
    setIsPending(true);
    const result = await addToCart(productId, quantity);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAdded(true);
    router.refresh();
  }

  return (
    // Mobile : barre collée au-dessus de la navigation du bas ; à partir de sm,
    // retour au bloc normal dans la fiche.
    <div
      data-sticky-cart
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-1 border-t border-border bg-cream px-4 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:static sm:z-auto sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
    >
      {added && <p className="text-sm text-primary sm:hidden">Ajouté au panier ✓</p>}
      {error && <p className="text-sm text-red-600 sm:hidden">{error}</p>}
      <div className="flex gap-2">
        <div className="flex items-center rounded border border-border bg-surface">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-l text-lg hover:bg-surface-muted active:bg-border sm:h-auto sm:w-auto sm:px-3 sm:py-2"
            aria-label="Diminuer la quantité"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => handleQuantityInput(e.target.value)}
            className="h-11 w-12 border-x border-border bg-surface text-center text-base text-foreground sm:h-auto sm:py-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Quantité"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-r text-lg hover:bg-surface-muted active:bg-border sm:h-auto sm:w-auto sm:px-3 sm:py-2"
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className={`${primaryButtonClass} min-h-11 flex-1`}
        >
          {isPending ? "Ajout..." : "Ajouter au panier"}
        </button>
      </div>
      {added && <p className="hidden text-sm text-primary sm:block">Ajouté au panier ✓</p>}
      {error && <p className="hidden text-sm text-red-600 sm:block">{error}</p>}
    </div>
  );
}
