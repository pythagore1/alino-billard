/** Génère un slug URL-safe à partir d'un nom (ex: "Étuis 2x2" -> "etuis-2x2"). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents (diacritiques Unicode)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
