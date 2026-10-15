"use client";

import { useActionState } from "react";
import {
  forceChangePasswordAction,
  type ForceChangePasswordState,
} from "@/server/actions/auth";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

const initialState: ForceChangePasswordState = {};

export default function NouveauMotDePassePage() {
  const [state, formAction, isPending] = useActionState(
    forceChangePasswordAction,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Choisissez un nouveau mot de passe</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Votre compte a un mot de passe temporaire — choisissez-en un nouveau, connu de
        vous seul, pour continuer.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <label className={labelClass}>
          Nouveau mot de passe
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Confirmer le mot de passe
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button type="submit" disabled={isPending} className={`mt-2 ${primaryButtonClass}`}>
          {isPending ? "Enregistrement..." : "Valider"}
        </button>
      </form>
    </main>
  );
}
