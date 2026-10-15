"use client";

import { useRef, useState, useTransition } from "react";
import { trackOrder } from "@/server/actions/orders";
import { formatPrice } from "@/lib/format";
import { formatOrderReference } from "@/lib/order-reference";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-status";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

type TrackedOrder = Extract<Awaited<ReturnType<typeof trackOrder>>, { success: true }>["data"];

/**
 * "hero" : version compacte en ligne, utilisée dans l'accueil (fond sombre).
 * "page" : version en carte, utilisée sur la page Suivi de commande.
 */
export function TrackOrderForm({
  variant = "hero",
  whatsappHref,
}: {
  variant?: "hero" | "page";
  whatsappHref?: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const isPage = variant === "page";

  function handleClose() {
    setOrder(null);
    setError(null);
    formRef.current?.reset();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const reference = String(form.get("reference") ?? "");
    const phone = String(form.get("phone") ?? "");

    startTransition(async () => {
      const result = await trackOrder(reference, phone);
      if (!result.success) {
        setOrder(null);
        setError(result.error);
        return;
      }
      setOrder(result.data);
    });
  }

  const orderWhatsappHref =
    order && whatsappHref
      ? `${whatsappHref}?text=${encodeURIComponent(
          `Bonjour, j'ai une question sur ma commande ${formatOrderReference(order.sequenceNumber)}.`,
        )}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={
          isPage
            ? "grid gap-4 rounded-2xl border border-border bg-surface p-5 text-foreground shadow-sm sm:grid-cols-2 sm:p-6"
            : "flex flex-wrap items-end gap-3"
        }
      >
        <label className={labelClass}>
          Référence de commande
          <input
            name="reference"
            required
            placeholder="RB-0142"
            autoComplete="off"
            className={`${inputClass} ${isPage ? "h-12" : ""}`}
          />
        </label>
        <label className={labelClass}>
          Téléphone utilisé à la commande
          <input
            name="phone"
            type="tel"
            required
            placeholder="+237 6XX XX XX XX"
            autoComplete="tel"
            className={`${inputClass} ${isPage ? "h-12" : ""}`}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className={`${primaryButtonClass} ${isPage ? "min-h-12 sm:col-span-2" : "min-h-11 sm:min-h-0"}`}
        >
          {isPending ? "Vérification..." : isPage ? "Suivre ma commande" : "Vérifier"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className={
            isPage
              ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "text-sm text-red-600"
          }
        >
          {error}
        </p>
      )}

      {/* text-foreground explicite sur la carte : évite d'hériter le texte
          clair du hero (même souci que les champs, voir lib/ui.ts) une fois
          cette carte affichée sur l'accueil. */}
      {order && (
        <div className="relative rounded-lg border border-border bg-surface p-5 text-foreground sm:p-6">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            ✕
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 pr-10">
            <div>
              <p className="text-sm text-muted-foreground">Référence</p>
              <p className="font-mono text-lg font-semibold">
                {formatOrderReference(order.sequenceNumber)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Statut</p>
              <span className="mt-0.5 inline-block rounded-full bg-primary/15 px-4 py-1.5 text-base font-semibold text-primary">
                {ORDER_STATUS_LABELS[order.orderStatus]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-b border-border py-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span className="shrink-0">{formatPrice(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-b border-border py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatPrice(order.total)}</span>
            </div>
            <p className="text-muted-foreground">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod]} — {order.address}, {order.city} (
              {order.region})
            </p>
            <p className="text-muted-foreground">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          </div>

          {order.statusHistory.length > 0 && (
            <div className="pt-4">
              <p className="mb-2 text-sm font-medium">Suivi</p>
              <ul className="flex flex-col gap-2">
                {order.statusHistory.map((step) => (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span className="flex-1">{ORDER_STATUS_LABELS[step.toStatus]}</span>
                    <span className="text-xs text-muted-foreground">
                      {step.createdAt.toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <a
              href={`/api/commandes/${order.orderNumber}/facture`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
            >
              📄 Télécharger la facture
            </a>
            {order.paymentStatus === "PAID" && order.orderStatus === "DELIVERED" && (
              <a
                href={`/api/commandes/${order.orderNumber}/recu`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
              >
                🧾 Télécharger le reçu
              </a>
            )}
            {orderWhatsappHref && (
              <a
                href={orderWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
              >
                💬 Une question sur cette commande ?
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
