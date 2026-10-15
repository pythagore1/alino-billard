import "server-only";
import { cache } from "react";
import { getCartItemCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth/guard";

/**
 * Données propres au visiteur (session, panier) lues dans la même requête par
 * l'en-tête et la barre du bas. Mémorisées le temps de la requête : une seule
 * lecture de cookie et de base, même si plusieurs composants la demandent.
 * À n'appeler que depuis un composant placé sous <Suspense> : c'est ce qui
 * permet au reste de la page d'être servi tout de suite depuis le cache.
 */
export const getShopSession = cache(async () => {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartItemCount()]);
  return { user, cartCount };
});
