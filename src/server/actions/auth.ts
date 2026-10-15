"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/guard";
import { getPostLoginPath } from "@/lib/auth/post-login-redirect";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { checkLoginRateLimit, checkPublicActionRateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema, passwordSchema, type RegisterInput } from "@/lib/validation/auth";
import { normalizePhone, phoneCandidates } from "@/lib/phone";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

/**
 * Connexion par email OU téléphone + mot de passe, pensée pour être branchée
 * sur `useActionState` (React 19) depuis un formulaire client.
 *
 * La redirection n'est PAS automatique via `signIn` (ce qui forçait tout le
 * monde vers "/" quel que soit son rôle) : on la pilote nous-mêmes une fois
 * la session posée, pour renvoyer le personnel (admin/livreur) vers /admin
 * même quand il s'est connecté directement depuis la page d'accueil, sans
 * passer par une redirection du Proxy avec un `callbackUrl`.
 */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  // Valeur issue de ?callbackUrl= : contrôlable par un tiers, donc restreinte aux chemins du site.
  const requestedRedirect = safeRedirectPath(formData.get("redirectTo"));
  const identifier = String(formData.get("identifier") || "");

  // Vercel pose x-forwarded-for avec l'IP réelle du visiteur en tête de
  // liste (les suivantes sont les proxys intermédiaires) — voir
  // https://vercel.com/docs/edge-network/headers#x-forwarded-for.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Même clé pour toutes les écritures d'un numéro, sinon changer le format
  // permettrait de contourner la limitation de tentatives.
  const rateLimitKey = identifier.includes("@") ? identifier.toLowerCase() : normalizePhone(identifier);
  const allowed = await checkLoginRateLimit(ip, rateLimitKey);
  if (!allowed) {
    return "Trop de tentatives de connexion. Réessayez dans quelques minutes.";
  }

  try {
    await signIn("credentials", {
      identifier,
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Identifiants incorrects.";
    }
    throw error;
  }

  // On relit le rôle directement en base plutôt que via auth()/la session :
  // le cookie de session vient tout juste d'être posé par signIn() sur CETTE
  // réponse, et Next.js ne permet pas de relire un cookie qu'on vient de
  // définir dans la même requête (cookies() ne verra la nouvelle session
  // qu'à la prochaine requête) — auth() renverrait donc encore "non connecté"
  // ici, ce qui a été vérifié en le testant réellement (redirection vers "/"
  // à chaque fois, quel que soit le rôle, avant ce correctif).
  const user = await db.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: { in: phoneCandidates(identifier) } }] },
    select: { role: true, mustChangePassword: true },
  });

  // Un mot de passe temporaire défini par un admin (réinitialisation
  // assistée) doit être remplacé avant tout accès au compte — sinon l'admin
  // qui l'a choisi pourrait continuer à s'en servir pour se connecter à la
  // place du titulaire. Prioritaire sur toute autre redirection.
  if (user?.mustChangePassword) {
    redirect("/compte/nouveau-mot-de-passe");
  }

  // Une destination précise était demandée (ex: le Proxy a bloqué l'accès à
  // /admin et renvoyé ici avec ?callbackUrl=/admin) : on la respecte telle
  // quelle. Sinon, on choisit selon le rôle — le livreur n'a rien à faire sur
  // le tableau de bord (chiffre d'affaires, etc.), il va directement sur son
  // propre espace restreint.
  if (requestedRedirect !== "/") {
    redirect(requestedRedirect);
  }

  redirect(getPostLoginPath(user?.role));
}

/**
 * Création d'un compte client (optionnel — la commande invité reste possible
 * sans compte, cf. cahier des charges). Le rôle est toujours CUSTOMER ici :
 * les comptes admin/livreur sont créés uniquement depuis l'administration
 * par un SUPER_ADMIN (jamais via un formulaire public). Email et téléphone
 * sont chacun facultatifs mais au moins l'un des deux est requis
 * (registerSchema) — un client peut créer un compte avec juste son numéro.
 */
export type RegisterFormState = {
  // Valeurs saisies, renvoyées en cas d'erreur : React vide le formulaire après
  // chaque action, le client ne doit pas avoir à tout retaper.
  values?: { name: string; phone: string; email: string };
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/** Wrapper pensé pour `useActionState` depuis le formulaire d'inscription. */
export async function registerCustomerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const password = String(formData.get("password") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const values = { name: String(formData.get("name") ?? ""), phone, email };

  if (!(await checkPublicActionRateLimit("register", await getClientIp(), 15))) {
    return { values, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  if (password !== String(formData.get("confirmPassword") ?? "")) {
    return { values, error: "Les deux mots de passe ne correspondent pas." };
  }

  const result = await registerCustomer({
    name: String(formData.get("name") ?? ""),
    email,
    phone,
    password,
  });

  if (!result.success) {
    return { values, error: result.error, fieldErrors: result.fieldErrors };
  }

  // Le client vient de choisir son mot de passe : on le connecte directement
  // plutôt que de lui demander de le retaper. Si la connexion échoue pour une
  // raison quelconque, le compte existe quand même et il peut se connecter.
  try {
    await signIn("credentials", {
      identifier: phone ? normalizePhone(phone) : email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { success: true };
    throw error;
  }
  redirect("/compte");
}

export async function registerCustomer(
  input: RegisterInput,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const email = parsed.data.email || undefined;
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;

  const existing = await db.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone: { in: phoneCandidates(phone) } }] : []),
      ],
    },
  });
  if (existing) {
    return actionError("Un compte existe déjà avec cet email ou ce numéro.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  return actionSuccess({ userId: user.id });
}

export type ForceChangePasswordState = { error?: string };

/**
 * Étape obligatoire après un mot de passe temporaire défini par un admin
 * (voir `mustChangePassword` sur `User`) — le nouveau mot de passe n'est
 * jamais vu par l'admin, ce qui referme l'accès qu'il avait temporairement.
 */
export async function forceChangePasswordAction(
  _prevState: ForceChangePasswordState,
  formData: FormData,
): Promise<ForceChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion");

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };
  }
  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const passwordHash = await bcrypt.hash(parsed.data, 12);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  redirect(getPostLoginPath(user.role));
}
