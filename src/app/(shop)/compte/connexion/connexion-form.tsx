"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authenticate } from "@/server/actions/auth";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";
import { PasswordField } from "@/components/shop/password-field";

export function ConnexionForm({ whatsappHref }: { whatsappHref: string | null }) {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  // Contrôlé pour que React ne le vide pas après une erreur de connexion.
  const [identifier, setIdentifier] = useState("");
  const searchParams = useSearchParams();
  // Posé par src/proxy.ts quand un accès à /admin a été bloqué faute de
  // session — on ramène l'utilisateur exactement là où il voulait aller.
  // Sans callbackUrl (arrivée directe sur cette page), authenticate() choisit
  // la destination selon le rôle une fois connecté (staff -> /admin).
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={callbackUrl} />

        <label className={labelClass}>
          E-mail ou téléphone
          <input
            type="text"
            name="identifier"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="+237 6XX XX XX XX"
            className={`${inputClass} h-12`}
          />
        </label>

        <PasswordField label="Mot de passe" name="password" autoComplete="current-password" />

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button type="submit" disabled={isPending} className={`${primaryButtonClass} min-h-12`}>
          {isPending ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <details className="mt-4 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center text-primary hover:underline">
          Mot de passe oublié ?
        </summary>
        <p className="pb-2 leading-relaxed text-muted-foreground">
          Écrivez-nous en indiquant le numéro ou l&apos;e-mail de votre compte. Nous vous donnons un mot de
          passe temporaire, que vous remplacerez par le vôtre dès votre prochaine connexion.
        </p>
        {whatsappHref && (
          <a
            href={`${whatsappHref}?text=${encodeURIComponent("Bonjour, j'ai oublié le mot de passe de mon compte ALINO-Billard.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center font-medium text-primary hover:underline"
          >
            Écrire sur WhatsApp →
          </a>
        )}
      </details>

      <p className="mt-2 border-t border-border pt-4 text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/compte/inscription"
          className="inline-flex min-h-11 items-center font-medium text-primary hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
