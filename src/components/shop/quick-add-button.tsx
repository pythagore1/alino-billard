"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/server/actions/cart";

/**
 * Bouton "Ajouter au panier" directement depuis une carte produit (liste,
 * accueil...) — toujours 1 unité, sans variante : pour un choix de quantité
 * ou de variante, le client passe par la fiche produit elle-même.
 */
export function QuickAddButton({ productId }: { productId: string }) {
  const router = useRouter();
  // État "pending" géré à la main plutôt qu'avec useTransition : le
  // router.refresh() qui suit un ajout réussi peut prendre plusieurs
  // secondes (recompilation, latence DB) et, imbriqué dans un
  // startTransition, gardait isPending à true pendant tout ce temps — le
  // bouton restait bloqué sur "Ajout..." et "Ajouté ✓" ne s'affichait
  // jamais. Ici isPending ne couvre que l'appel serveur addToCart lui-même.
  const [isPending, setIsPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // Le bouton est en dehors du <Link> de la carte (un <button> ne peut pas
    // être imbriqué dans un <a>) mais stopPropagation() reste utile si la
    // carte elle-même devient cliquable un jour.
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsPending(true);
    const result = await addToCart(productId, 1);
    setIsPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setAdded(true);
    router.refresh();
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded border border-primary px-3 py-1.5 text-sm font-medium whitespace-nowrap text-primary hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground disabled:opacity-60 sm:min-h-0 sm:text-xs"
      >
        <span aria-hidden>🛒</span>
        {isPending ? "Ajout..." : added ? "Ajouté ✓" : (<><span className="sm:hidden">Ajouter</span><span className="hidden sm:inline">Ajouter au panier</span></>)}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
