"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/server/actions/settings";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

type Settings = {
  storeName: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
  mtnNumber: string | null;
  orangeNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  taxEnabled: boolean;
  taxRate: number;
  currency: string;
  freeShippingThreshold: number | null;
  expeditionFeePercent: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber ?? "");
  const [mtnNumber, setMtnNumber] = useState(settings.mtnNumber ?? "");
  const [orangeNumber, setOrangeNumber] = useState(settings.orangeNumber ?? "");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(settings.contactPhone ?? "");
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [currency, setCurrency] = useState(settings.currency);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    settings.freeShippingThreshold?.toString() ?? "",
  );
  const [expeditionFeePercent, setExpeditionFeePercent] = useState(
    settings.expeditionFeePercent.toString(),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateSiteSettings({
        storeName,
        logoUrl,
        whatsappNumber,
        mtnNumber,
        orangeNumber,
        contactEmail,
        contactPhone,
        taxEnabled,
        taxRate: Number(taxRate),
        currency,
        freeShippingThreshold: freeShippingThreshold ? Number(freeShippingThreshold) : undefined,
        expeditionFeePercent: Number(expeditionFeePercent),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <label className={labelClass}>
        Nom de la boutique
        <input className={inputClass} value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
      </label>

      <label className={labelClass}>
        URL du logo
        <input className={inputClass} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          WhatsApp
          <input
            className={inputClass}
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </label>
        <label className={labelClass}>
          MTN Mobile Money
          <input
            className={inputClass}
            value={mtnNumber}
            onChange={(e) => setMtnNumber(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </label>
        <label className={labelClass}>
          Orange Money
          <input
            className={inputClass}
            value={orangeNumber}
            onChange={(e) => setOrangeNumber(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Email de contact
          <input
            type="email"
            className={inputClass}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Téléphone de contact
          <input className={inputClass} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} />
          TVA activée
        </label>
        <label className={labelClass}>
          Taux TVA (%)
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Devise
          <input
            className={inputClass}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
          />
        </label>
        <label className={labelClass}>
          Livraison gratuite dès (FCFA)
          <input
            type="number"
            className={inputClass}
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Frais Expédition hors Yaoundé (%)
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            className={inputClass}
            value={expeditionFeePercent}
            onChange={(e) => setExpeditionFeePercent(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-primary">Paramètres enregistrés.</p>}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
