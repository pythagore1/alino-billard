import fs from "node:fs";
import path from "node:path";

const EXTENSIONS = ["jpg", "jpeg", "png"] as const;

/**
 * Photo de bannière facultative, déposée manuellement dans public/
 * (ex: boutique.jpg, categories.png) — même logique que le logo et le hero
 * de l'accueil : tant qu'elle n'y est pas, un dégradé noir → vert billard
 * tient lieu de fond, sans rien à changer dans le code une fois la photo
 * ajoutée.
 */
export function getBannerPhotoUrl(name: string): string | null {
  const extension = EXTENSIONS.find((ext) =>
    fs.existsSync(path.join(process.cwd(), "public", `${name}.${ext}`)),
  );
  return extension ? `/${name}.${extension}` : null;
}
