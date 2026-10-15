"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, initiatePaymentForOrder } from "@/server/actions/orders";
import { formatPrice } from "@/lib/format";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";
import { CAMEROON_REGIONS, CITIES_BY_REGION, isYaounde, type CameroonRegion } from "@/lib/cameroon-locations";
import type { DeliveryMethodType } from "@/generated/prisma/enums";

type ShippingRate = { id: string; method: DeliveryMethodType; price: number; freeAbove: number | null };

const METHOD_LABELS: Record<string, string> = {
  STANDARD: "Livraison standard",
  EXPRESS: "Livraison express",
  PICKUP: "Retrait en boutique",
  EXPEDITION: "Expédition",
};

const PAYMENT_LABELS = {
  CASH_ON_DELIVERY: "Paiement à la livraison (espèces)",
  NOTCHPAY_MTN: "MTN Mobile Money",
  NOTCHPAY_ORANGE: "Orange Money",
} as const;

type PaymentMethod = keyof typeof PAYMENT_LABELS;

const PHONE_PATTERN = "^(\\+?237)?\\s*6\\d{2}\\s*\\d{2}\\s*\\d{2}\\s*\\d{2}$";

export function CheckoutForm({
  yaoundeRates,
  expeditionFeePercent,
  subtotal,
  defaultName = "",
  defaultPhone = "",
}: {
  yaoundeZoneId: string | null;
  yaoundeRates: ShippingRate[];
  expeditionFeePercent: number;
  subtotal: number;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [region, setRegion] = useState<CameroonRegion | "">("");
  const [city, setCity] = useState("");
  const [method, setMethod] = useState<"STANDARD" | "EXPRESS" | "PICKUP" | "EXPEDITION">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");

  const yaoundeSelected = isYaounde(city);
  const availableMethods: Array<"STANDARD" | "EXPRESS" | "PICKUP" | "EXPEDITION"> = yaoundeSelected
    ? ["STANDARD", "EXPRESS", "PICKUP"]
    : ["EXPEDITION"];
  const availablePayments: PaymentMethod[] = yaoundeSelected
    ? ["CASH_ON_DELIVERY", "NOTCHPAY_MTN", "NOTCHPAY_ORANGE"]
    : ["NOTCHPAY_MTN", "NOTCHPAY_ORANGE"];

  // Si la ville change et rend le choix précédent invalide (ex: COD alors
  // qu'on vient de quitter Yaoundé), on retombe sur la première option
  // disponible — calculé à chaque rendu plutôt que via un effet, pour ne
  // jamais soumettre une combinaison invalide sans provoquer de rendu en
  // cascade.
  const effectiveMethod = availableMethods.includes(method) ? method : availableMethods[0];
  const effectivePaymentMethod = availablePayments.includes(paymentMethod)
    ? paymentMethod
    : availablePayments[0];

  const shippingFee = useMemo(() => {
    if (effectiveMethod === "PICKUP") return 0;
    if (effectiveMethod === "EXPEDITION") return Math.round((subtotal * expeditionFeePercent) / 100);
    const rate = yaoundeRates.find((r) => r.method === effectiveMethod);
    if (!rate) return 0;
    return rate.freeAbove && subtotal >= rate.freeAbove ? 0 : rate.price;
  }, [effectiveMethod, yaoundeRates, subtotal, expeditionFeePercent]);

  const total = subtotal + shippingFee;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!region) {
      setError("Choisissez une région.");
      return;
    }
    if (!CITIES_BY_REGION[region].includes(city)) {
      setError("Choisissez une ville dans la liste.");
      return;
    }

    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createOrder({
        guestName: String(form.get("guestName") ?? ""),
        guestPhone: String(form.get("guestPhone") ?? ""),
        region,
        city,
        address: String(form.get("address") ?? ""),
        deliveryMethod: effectiveMethod,
        paymentMethod: effectivePaymentMethod,
        notes: String(form.get("notes") ?? "") || undefined,
      });

      if (!result.success) {
        const details = result.fieldErrors ? Object.values(result.fieldErrors).flat().join(" ") : "";
        setError(details ? `${result.error} — ${details}` : result.error);
        return;
      }

      if (effectivePaymentMethod === "CASH_ON_DELIVERY") {
        router.push(`/commande/confirmation/${result.data.orderNumber}`);
        return;
      }

      // Mobile Money : deuxième étape, on récupère le lien de paiement
      // hébergé NotchPay et on y redirige entièrement le client (jamais de
      // saisie de code Mobile Money sur notre propre site).
      const payment = await initiatePaymentForOrder(result.data.orderNumber);
      if (!payment.success) {
        setError(payment.error);
        return;
      }
      window.location.href = payment.data.redirectUrl;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 sm:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Nom complet
            <input name="guestName" required minLength={3} defaultValue={defaultName} autoComplete="name" className={inputClass} />
          </label>
          <label className={labelClass}>
            Téléphone
            <input
              name="guestPhone"
              defaultValue={defaultPhone}
              autoComplete="tel"
              required
              pattern={PHONE_PATTERN}
              title="Format : 6XX XX XX XX (avec ou sans +237)"
              placeholder="+237 6XX XX XX XX"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Région
            {/* <select> plutôt qu'un input+datalist : au clic, la liste
                complète se rouvre toujours, pas besoin d'effacer le texte
                pour changer d'avis. Taper une lettre saute à l'option
                correspondante (comportement natif du navigateur). */}
            <select
              value={region}
              required
              className={inputClass}
              onChange={(e) => {
                setRegion(e.target.value as CameroonRegion);
                setCity("");
              }}
            >
              <option value="" disabled>
                — Choisir —
              </option>
              {CAMEROON_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Ville
            <select
              value={city}
              required
              disabled={!region}
              className={inputClass}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="" disabled>
                {region ? "— Choisir —" : "Région d'abord"}
              </option>
              {(region ? CITIES_BY_REGION[region] : []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Quartier (et repère)
          <input name="address" required minLength={5} className={inputClass} />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Mode de livraison</legend>
          {!city ? (
            <p className="text-sm text-muted-foreground">Choisissez votre ville pour voir les options.</p>
          ) : (
            availableMethods.map((m) => (
              <label key={m} className="flex min-h-11 items-center gap-2 text-sm sm:min-h-0">
                <input
                  type="radio"
                  className="h-5 w-5 accent-[var(--color-primary)] sm:h-4 sm:w-4"
                  name="deliveryMethod"
                  checked={effectiveMethod === m}
                  onChange={() => setMethod(m)}
                />
                {METHOD_LABELS[m]}
              </label>
            ))
          )}
        </fieldset>

        <label className={labelClass}>
          Notes (optionnel)
          <textarea name="notes" rows={2} className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">Paiement</legend>
          {!city ? (
            <p className="text-sm text-muted-foreground">Choisissez votre ville pour voir les options.</p>
          ) : (
            availablePayments.map((p) => (
              <label key={p} className="flex min-h-11 items-center gap-2 text-sm sm:min-h-0">
                <input
                  type="radio"
                  className="h-5 w-5 accent-[var(--color-primary)] sm:h-4 sm:w-4"
                  checked={effectivePaymentMethod === p}
                  onChange={() => setPaymentMethod(p)}
                />
                {PAYMENT_LABELS[p]}
              </label>
            ))
          )}
        </fieldset>

        {/* Mobile : résumé + bouton collés au-dessus de la navigation ; bureau : bloc normal */}
        <div data-sticky-cart className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-2 border-t border-border bg-cream px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:static sm:z-auto sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="hidden rounded-lg border border-border bg-surface-muted p-4 text-sm sm:block">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{!city ? "À calculer" : shippingFee === 0 ? "Gratuite" : formatPrice(shippingFee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>{city ? "Total" : "Total (hors livraison)"}</span>
              <span>{formatPrice(city ? total : subtotal)}</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between sm:hidden">
            <div>
              <p className="text-base font-semibold">
                {city ? "Total" : "Total hors livraison"} : {formatPrice(city ? total : subtotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                {city
                  ? `${formatPrice(subtotal)} + livraison ${shippingFee === 0 ? "gratuite" : formatPrice(shippingFee)}`
                  : "Livraison à calculer : choisissez votre ville"}
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={isPending} className={`${primaryButtonClass} min-h-11`}>
            {isPending ? "Validation..." : "Confirmer la commande"}
          </button>
        </div>
      </div>
    </form>
  );
}
