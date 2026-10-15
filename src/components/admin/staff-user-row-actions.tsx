"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetStaffUserPassword, toggleStaffUserActive } from "@/server/actions/admin-users";
import { inputClass, secondaryButtonClass } from "@/lib/ui";

export function StaffUserRowActions({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleStaffUserActive(userId);
      if (!result.success) alert(result.error);
      router.refresh();
    });
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resetStaffUserPassword(userId, newPassword);
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
            Mot de passe temporaire défini ✓ — un nouveau sera demandé à la prochaine connexion.
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setResetting(true)}
        className={secondaryButtonClass}
      >
        Changer le mot de passe
      </button>
      <button type="button" disabled={isPending} onClick={handleToggle} className={secondaryButtonClass}>
        {isActive ? "Désactiver" : "Activer"}
      </button>
    </div>
  );
}
