// Un numéro camerounais s'écrit de plusieurs façons (« 6 56 92 94 80 »,
// « +237 656 92 94 80 », « 237656929480 »...). On l'enregistre toujours sous la
// forme canonique « +2376XXXXXXXX » et on le retrouve sous toutes ses écritures,
// pour que la connexion et la détection de doublons ne dépendent pas de la façon
// dont le client l'a tapé.
const CAMEROON_NUMBER = /^(?:237)?([26]\d{8})$/;

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  const match = CAMEROON_NUMBER.exec(digits);
  return match ? `+237${match[1]}` : trimmed;
}

/** Toutes les écritures sous lesquelles ce numéro a pu être enregistré. */
export function phoneCandidates(input: string): string[] {
  const canonical = normalizePhone(input);
  const candidates = new Set<string>([canonical, input.trim()]);
  if (canonical.startsWith("+237")) {
    candidates.add(canonical.slice(1));
    candidates.add(canonical.slice(4));
  }
  return [...candidates].filter(Boolean);
}
