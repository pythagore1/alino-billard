"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDeliveryStatus } from "@/server/actions/delivery-tracking";
import { getAllowedDeliveryStatuses } from "@/lib/delivery-status";
import { DELIVERY_STATUS_LABELS as STATUS_LABELS } from "@/lib/order-status";
import { inputClass } from "@/lib/ui";
import type { DeliveryStatus } from "@/generated/prisma/enums";

export function MyDeliveryStatusControl({
  deliveryId,
  status,
}: {
  deliveryId: string;
  status: DeliveryStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Ne propose que le statut actuel + les transitions autorisées (jamais en
  // arrière, jamais après "Livrée"/"Échec") — appliqué aussi côté serveur
  // dans updateDeliveryStatus, ceci n'est qu'un reflet dans l'interface.
  const allowedStatuses = getAllowedDeliveryStatuses(status);
  const isTerminal = allowedStatuses.length === 1 && allowedStatuses[0] === status;

  function handleChange(next: DeliveryStatus) {
    startTransition(async () => {
      const result = await updateDeliveryStatus(deliveryId, next);
      if (!result.success) alert(result.error);
      router.refresh();
    });
  }

  if (isTerminal) {
    return (
      <span className="rounded border border-border bg-surface-muted px-3 py-2 text-sm text-muted-foreground">
        {STATUS_LABELS[status]}
      </span>
    );
  }

  return (
    <select
      className={inputClass}
      value={status}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as DeliveryStatus)}
    >
      {allowedStatuses.map((value) => (
        <option key={value} value={value}>
          {STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}
