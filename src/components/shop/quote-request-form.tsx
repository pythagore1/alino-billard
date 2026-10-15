"use client";

import { useState, useTransition } from "react";
import { submitQuoteRequest } from "@/server/actions/services";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function QuoteRequestForm({ serviceId }: { serviceId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await submitQuoteRequest({
        serviceId,
        guestName: String(form.get("guestName") ?? ""),
        guestPhone: String(form.get("guestPhone") ?? ""),
        description: String(form.get("description") ?? ""),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <p className="rounded border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
        Votre demande de devis a bien été envoyée. Nous vous contactons rapidement.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Nom
          <input name="guestName" required className={inputClass} />
        </label>
        <label className={labelClass}>
          Téléphone
          <input name="guestPhone" required className={inputClass} placeholder="+237 6XX XXX XXX" />
        </label>
      </div>
      <label className={labelClass}>
        Décrivez votre demande
        <textarea name="description" required rows={3} minLength={10} className={inputClass} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Envoi..." : "Demander un devis"}
      </button>
    </form>
  );
}
