// Classes Tailwind partagées pour les formulaires admin — évite de répéter
// les mêmes chaînes dans chaque formulaire (catégorie, produit, service...).
// text-foreground explicite : sans ça, un champ placé sur une section à fond
// sombre (ex: le hero) hérite de la couleur de texte claire de son parent et
// devient illisible (texte blanc sur fond de champ blanc).
export const inputClass =
  "rounded border border-border bg-surface px-3 py-2.5 text-base text-foreground sm:py-2 sm:text-sm focus:border-primary focus:outline-none";
export const labelClass = "flex flex-col gap-1 text-sm";
export const primaryButtonClass =
  "rounded bg-primary px-4 py-3 text-sm font-medium sm:py-2 text-primary-foreground disabled:opacity-60";
export const secondaryButtonClass =
  "rounded border border-border px-4 py-3 text-sm font-medium sm:py-2 hover:bg-surface-muted";
export const dangerButtonClass =
  "rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50";
