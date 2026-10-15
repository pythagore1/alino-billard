/**
 * Insère des paramètres de transformation Cloudinary (format + qualité
 * automatiques, largeur plafonnée) dans une URL de livraison déjà stockée.
 * L'original reste tel quel sur Cloudinary — l'optimisation ne se fait qu'à
 * l'affichage, via l'URL, jamais en modifiant le fichier source.
 *
 * Testé : une photo produit de 249 Ko en PNG brut tombe à ~41 Ko avec
 * `f_auto,q_auto` (encore moins en WebP/AVIF pour un vrai navigateur) — sans
 * même compter le plafonnement de largeur pour les vignettes.
 *
 * Ne touche jamais les URLs qui ne sont pas de vraies livraisons Cloudinary
 * (ex. une image ajoutée manuellement par URL externe depuis l'admin).
 */
export function cloudinaryOptimized(url: string, width?: number): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const transform = width ? `f_auto,q_auto,w_${width},c_limit` : "f_auto,q_auto";
  return url.replace("/upload/", `/upload/${transform}/`);
}

export function cloudinarySrcSet(url: string, widths: number[]): string | undefined {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return undefined;
  return widths.map((w) => `${cloudinaryOptimized(url, w)} ${w}w`).join(", ");
}
