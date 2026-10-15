"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomerAction, type RegisterFormState } from "@/server/actions/auth";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";
import { PasswordField } from "@/components/shop/password-field";

const initialState: RegisterFormState = {};

export function InscriptionForm() {
  const [state, formAction, isPending] = useActionState(registerCustomerAction, initialState);

  // Repli : le compte est créé mais la connexion automatique a échoué.
  if (state.success) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <h2 className="font-display text-2xl font-bold">Compte créé</h2>
        <p className="mt-2 text-muted-foreground">Votre compte Alino Billard & Accessoires a été créé avec succès.</p>
        <Link
          href="/compte/connexion"
          className={`${primaryButtonClass} mt-5 flex min-h-12 items-center justify-center`}
        >
          Se connecter maintenant
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <label className={labelClass}>
          Nom complet
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            defaultValue={state.values?.name}
            className={`${inputClass} h-12`}
          />
        </label>

        <label className={labelClass}>
          Téléphone
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            placeholder="+237 6XX XX XX XX"
            defaultValue={state.values?.phone}
            className={`${inputClass} h-12`}
          />
        </label>

        <label className={labelClass}>
          E-mail (facultatif)
          <input
            type="email"
            name="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            className={`${inputClass} h-12`}
          />
        </label>

        <PasswordField
          label="Mot de passe (8 caractères minimum)"
          name="password"
          autoComplete="new-password"
          minLength={8}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
        />

        {state.error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={isPending} className={`${primaryButtonClass} min-h-12`}>
          {isPending ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/compte/connexion"
          className="inline-flex min-h-11 items-center font-medium text-primary hover:underline"
        >
          Se connecter
        </Link>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Un compte n&apos;est pas obligatoire : vous pouvez aussi commander en tant qu&apos;invité.
      </p>
    </div>
  );
}
