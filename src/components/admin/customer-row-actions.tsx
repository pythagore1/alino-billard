"use client";

import { useState, useTransition } from "react";
import { resetCustomerPassword } from "@/server/actions/admin-customers";
import { inputClass, secondaryButtonClass } from "@/lib/ui";

export function CustomerRowActions({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resetCustomerPassword(userId, newPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
      setNewPassword("");
    });
  }

  if (resetting) {
    return (
      <form onSubmit={handleResetSubmit} className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          <input
            type="password"
            required
            minLength={8}
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`${inputClass} w-44`}
            autoFocus
          />
          <button type="submit" disabled={isPending} className={secondaryButtonClass}>
            Valider
          </button>
          <button
            type="button"
            onClick={() => {
              setResetting(false);
              setError(null);
              setDone(false);
            }}
            className="text-sm text-muted-foreground underline"
          >
            Annuler
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {done && (
          <p className="text-xs text-primary">
            Mot de passe temporaire défini ✓ — communique-le au client. Il devra en choisir un
            nouveau à sa prochaine connexion.
          </p>
        )}
      </form>
    );
  }

  return (
    <button type="button" onClick={() => setResetting(true)} className={secondaryButtonClass}>
      Réinitialiser le mot de passe
    </button>
  );
}
