import type { OrderStatus, OrderPaymentStatus, DeliveryStatus } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  AWAITING_CONFIRMATION: "En attente de confirmation",
  CHECKING_AVAILABILITY: "Disponibilité en vérification",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête à livrer",
  SHIPPING: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  FAILED: "Échec",
};

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  FAILED: "Échouée",
  REFUNDED: "Remboursée",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Paiement à la livraison",
  NOTCHPAY_MTN: "MTN Mobile Money",
  NOTCHPAY_ORANGE: "Orange Money",
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  STANDARD: "Livraison standard",
  EXPRESS: "Livraison express",
  PICKUP: "Retrait en boutique",
  EXPEDITION: "Expédition",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "En attente d'assignation",
  ASSIGNED: "Assignée",
  PICKED_UP: "Récupérée",
  IN_TRANSIT: "En route",
  DELIVERED: "Livrée",
  FAILED: "Échec de livraison",
};
