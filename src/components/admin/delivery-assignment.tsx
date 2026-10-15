"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignDelivery, updateDeliveryStatus } from "@/server/actions/delivery-tracking";
import { canReassignDelivery, getAllowedDeliveryStatuses } from "@/lib/delivery-status";
import { inputClass, primaryButtonClass } from "@/lib/ui";
import type { DeliveryStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "En attente d'assignation",
  ASSIGNED: "Assignée",
  PICKED_UP: "Récupérée",
  IN_TRANSIT: "En route",
  DELIVERED: "Livrée",
  FAILED: "Échec de livraison",
};

type DeliveryPerson = { id: string; name: string; activeDeliveryCount: number };

export function DeliveryAssignment({
  orderId,
  deliveryPersons,
  delivery,
}: {
  orderId: string;
  deliveryPersons: DeliveryPerson[];
  delivery: { id: string; status: DeliveryStatus; assignedTo: { id: string; name: string } | null } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPerson, setSelectedPerson] = useState(delivery?.assignedTo?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const canReassign = canReassignDelivery(delivery?.status ?? null);
  const allowedStatuses = delivery ? getAllowedDeliveryStatuses(delivery.status) : [];
  const statusIsTerminal = allowedStatuses.length === 1;

  function handleAssign() {
    if (!selectedPerson) return;
    setError(null);
    startTransition(async () => {
      const result = await assignDelivery(orderId, selectedPerson);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function handleStatusChange(status: DeliveryStatus) {
    if (!delivery) return;
    setError(null);
    startTransition(async () => {
      const result = await updateDeliveryStatus(delivery.id, status);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {canReassign ? (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Livreur assigné
            <select
              className={inputClass}
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            >
              <option value="">— Aucun —</option>
              {deliveryPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.activeDeliveryCount} livraison{p.activeDeliveryCount > 1 ? "s" : ""} en cours
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isPending || !selectedPerson}
            className={primaryButtonClass}
          >
            {delivery ? "Réassigner" : "Assigner"}
          </button>
        </>
      ) : (
        <div className="rounded border border-border bg-surface-muted p-3 text-sm">
          <p className="text-muted-foreground">Livreur assigné</p>
          <p className="font-medium">{delivery?.assignedTo?.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Changement de livreur impossible : la livraison a déjà été prise en charge.
          </p>
        </div>
      )}

      {delivery &&
        (statusIsTerminal ? (
          <p className="text-sm text-muted-foreground">
            Statut de livraison : <span className="font-medium">{STATUS_LABELS[delivery.status]}</span>
          </p>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            Statut de livraison
            <select
              className={inputClass}
              value={delivery.status}
              disabled={isPending}
              onChange={(e) => handleStatusChange(e.target.value as DeliveryStatus)}
            >
              {allowedStatuses.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
