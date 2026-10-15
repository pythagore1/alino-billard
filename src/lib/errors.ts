/**
 * Résultat générique renvoyé par toutes les Server Actions du site.
 * Permet au frontend de distinguer succès/échec sans dépendre d'exceptions
 * qui traversent la frontière client/serveur (souvent tronquées par Next.js
 * en production pour ne pas divulguer de détails internes).
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError<T>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { success: false, error, fieldErrors };
}

/**
 * Erreur métier volontaire (ex: produit indisponible, email déjà utilisé).
 * À la différence d'une erreur technique, son message est sûr à afficher
 * tel quel au client.
 */
export class BusinessError extends Error {}
