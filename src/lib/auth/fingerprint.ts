/**
 * Empreinte courte du mot de passe, notée dans le jeton de session à la
 * connexion : tant que le mot de passe ne change pas, elle reste identique ;
 * dès qu'il est modifié ou réinitialisé, les anciennes sessions sont refusées.
 */
export function passwordFingerprint(passwordHash: string | null | undefined): string {
  // Fragment du hash bcrypt (sel + début) : change dès que le mot de passe change.
  return (passwordHash ?? "").slice(7, 23);
}
