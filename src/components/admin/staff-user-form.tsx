"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaffUser } from "@/server/actions/admin-users";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

type StaffRole = "ADMIN" | "SUPER_ADMIN" | "DELIVERY";

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super administrateur",
  DELIVERY: "Livreur",
};

export function StaffUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("DELIVERY");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createStaffUser({ name, email, password, role });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <label className={labelClass}>
        Nom
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className={labelClass}>
        Email
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className={labelClass}>
        Mot de passe temporaire
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      <label className={labelClass}>
        Rôle
        <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-primary">Compte créé avec succès.</p>}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Création..." : "Créer le compte"}
      </button>
    </form>
  );
}
