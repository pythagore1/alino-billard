/**
 * Destination de redirection après connexion, issue d'un paramètre d'URL
 * (?callbackUrl=...) donc contrôlable par n'importe qui : un lien piégé du type
 * /compte/connexion?callbackUrl=https://faux-site.com renverrait sinon le client
 * vers un faux site juste après sa connexion (hameçonnage). On n'accepte qu'un
 * chemin du site lui-même ; tout le reste retombe sur l'accueil.
 */
export function safeRedirectPath(input: unknown): string {
  if (typeof input !== "string") return "/";
  if (!input.startsWith("/")) return "/";
  // "//hote" et "/\hote" sont lus par les navigateurs comme une adresse externe.
  if (input.startsWith("//") || input.startsWith("/\\")) return "/";
  // Caractères de contrôle ou antislash : jamais légitimes dans un chemin interne.
  if (/[\u0000-\u001f\u007f\\]/.test(input)) return "/";
  try {
    const parsed = new URL(input, "https://site.invalid");
    if (parsed.origin !== "https://site.invalid") return "/";
  } catch {
    return "/";
  }
  return input;
}
