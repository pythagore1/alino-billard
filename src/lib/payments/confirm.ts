import "server-only";
import { db } from "@/lib/db";
import { getProviderForPayment } from "./active-provider";

/**
 * Point d'entrée unique pour confirmer un paiement Mobile Money (NotchPay ou
 * Monetbil), appelé à la fois par le webhook (source de vérité asynchrone) et
 * par la page de confirmation au retour du client (pour un feedback immédiat).
 * Toujours revérifié en direct auprès du fournisseur qui a créé le paiement —
 * jamais de confiance aveugle dans le contenu du webhook ni dans le simple
 * fait que le client soit revenu sur le site (cahier des charges section 11).
 *
 * Idempotent : appelable plusieurs fois sans effet de bord une fois le
 * paiement déjà confirmé.
 */
type OrderWithPayments = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function loadOrder(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    // Plusieurs tentatives possibles pour une même commande : on les vérifie
    // toutes (récentes d'abord), pour qu'une tentative en attente plus récente
    // ne masque jamais un paiement réellement abouti.
    include: { payments: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
}

export async function confirmOrderPayment(orderNumber: string) {
  const order = await loadOrder(orderNumber);
  if (!order) return { ok: false as const, reason: "order_not_found" as const };

  if (order.paymentStatus === "PAID") {
    return { ok: true as const, alreadyProcessed: true, status: "SUCCESS" as const };
  }
  if (order.payments.length === 0) return { ok: false as const, reason: "payment_not_found" as const };

  let latest: { ok: true; status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" } | { ok: false; reason: "no_provider" } | null =
    null;
  for (const [index, payment] of order.payments.entries()) {
    const result = await processPayment(order, payment, index === 0);
    if (index === 0) latest = result;
    if (result.ok && result.status === "SUCCESS") return { ok: true as const, status: "SUCCESS" as const };
  }
  return latest ?? { ok: false as const, reason: "payment_not_found" as const };
}

async function processPayment(order: OrderWithPayments, payment: OrderWithPayments["payments"][number], isLatest: boolean) {
  const orderNumber = order.orderNumber;
  if (payment.status === "SUCCESS") {
    return { ok: true as const, status: "SUCCESS" as const };
  }

  const provider = getProviderForPayment(payment.provider);
  if (!provider) return { ok: false as const, reason: "no_provider" as const };

  // payment.providerReference est la référence du fournisseur (ex: "trx.test_..."
  // chez NotchPay, "..." chez Monetbil), pas notre numéro de commande.
  const verification = await provider.verifyPayment(payment.providerReference, payment);

  // Monetbil : un paiement « accepté » dont le montant ne correspond
  // pas à celui de la commande (ou dont le montant est inconnu) n'est jamais
  // considéré comme payé (altération ou erreur) — il reste en attente et
  // l'incident est journalisé pour vérification manuelle.
  if (
    payment.provider === "MONETBIL" &&
    verification.status === "SUCCESS" &&
    verification.amount !== payment.amount
  ) {
    console.error(
      `${payment.provider} : montant vérifié (${verification.amount}) différent du montant attendu (${payment.amount}) pour la commande ${orderNumber}.`,
    );
    return { ok: true as const, status: "PENDING" as const };
  }

  // Une ancienne tentative n'est prise en compte que si elle a abouti : son
  // échec ou son attente ne doit pas modifier l'état de la commande.
  if (!isLatest && verification.status !== "SUCCESS") {
    return { ok: true as const, status: verification.status };
  }

  await db.$transaction(async (tx) => {
    const freshPayment = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    if (freshPayment.status === "SUCCESS") return; // déjà traité par un appel concurrent

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: verification.status,
        rawPayload: verification.raw as object,
        confirmedAt: verification.status === "SUCCESS" ? new Date() : null,
      },
    });

    if (verification.status === "SUCCESS") {
      const freshOrder = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      if (freshOrder.paymentStatus !== "PAID") {
        const nextStatus = freshOrder.orderStatus === "NEW" ? "CONFIRMED" : freshOrder.orderStatus;
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID", orderStatus: nextStatus },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, fromStatus: freshOrder.orderStatus, toStatus: nextStatus },
        });
      }
    } else if (isLatest && (verification.status === "FAILED" || verification.status === "CANCELLED")) {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    }
  });

  return { ok: true as const, status: verification.status };
}
