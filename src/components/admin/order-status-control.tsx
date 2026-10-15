"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderPaymentStatus, updateOrderStatus } from "@/server/actions/admin-orders";
import { ORDER_PAYMENT_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { inputClass } from "@/lib/ui";
import type { OrderPaymentStatus, OrderStatus } from "@/generated/prisma/enums";

export function OrderStatusControl({
  orderId,
  orderStatus,
  paymentStatus,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: OrderPaymentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(status: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function handlePaymentStatusChange(status: OrderPaymentStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderPaymentStatus(orderId, status);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Statut de la commande
        <select
          className={inputClass}
          value={orderStatus}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Statut du paiement
        <select
          className={inputClass}
          value={paymentStatus}
          disabled={isPending}
          onChange={(e) => handlePaymentStatusChange(e.target.value as OrderPaymentStatus)}
        >
          {Object.entries(ORDER_PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
