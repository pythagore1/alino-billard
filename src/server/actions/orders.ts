"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getCartId, getCartWithItems } from "@/lib/cart";
import { isOrderable } from "@/lib/availability";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/order";
import { getUnitPrice } from "@/lib/pricing";
import { notifyRole } from "@/lib/notifications";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";
import { getActiveMobileMoneyProvider, isMobileMoneyConfigured } from "@/lib/payments/active-provider";
import { getCurrentUser } from "@/lib/auth/guard";
import { getSiteSettings } from "@/lib/site-settings";
import { YAOUNDE_CITY } from "@/lib/cameroon-locations";
import { formatOrderReference, parseOrderReference } from "@/lib/order-reference";
import { checkPublicActionRateLimit, checkTrackingRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Seule Yaoundé a une zone/tarifs dédiés (livraison standard/express,
 * retrait boutique) — tout le reste du pays passe par "Expédition" à
 * SiteSettings.expeditionFeePercent, voir createOrder().
 */
export async function getCheckoutDeliveryOptions() {
  const [yaoundeZone, settings] = await Promise.all([
    db.deliveryZone.findFirst({
      where: { name: YAOUNDE_CITY, isActive: true },
      include: { rates: true },
    }),
    getSiteSettings(),
  ]);

  return {
    yaoundeZoneId: yaoundeZone?.id ?? null,
    yaoundeRates: yaoundeZone?.rates ?? [],
    expeditionFeePercent: settings.expeditionFeePercent,
  };
}

function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  // 8 octets (64 bits) plutôt que 4 : la page de confirmation et l'API de
  // paiement n'imposent aucune authentification (le client vient d'un
  // simple redirect), donc ce numéro doit être pratiquement impossible à
  // deviner par force brute — pas seulement "peu probable" (audit sécurité).
  const randomPart = crypto.randomBytes(8).toString("hex");
  return `RB-${datePart}-${randomPart}`;
}

/**
 * Crée la commande à partir du panier serveur (jamais depuis des données
 * envoyées par le client) : prix, disponibilité et frais de livraison sont
 * tous recalculés côté serveur au moment de la commande.
 */
export async function createOrder(
  input: CheckoutInput,
): Promise<ActionResult<{ orderNumber: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }
  if (!(await checkPublicActionRateLimit("order", await getClientIp(), 20))) {
    return actionError("Trop de demandes. Réessayez dans quelques minutes.");
  }

  // On ne crée jamais une commande avec un moyen de paiement qui ne peut pas
  // être honoré : si les clés NotchPay ne sont pas encore configurées, on le
  // dit clairement plutôt que de laisser échouer l'étape suivante sans
  // explication.
  if (parsed.data.paymentMethod !== "CASH_ON_DELIVERY" && !isMobileMoneyConfigured()) {
    return actionError(
      "Le paiement Mobile Money n'est pas encore configuré. En attendant, choisissez le paiement à la livraison.",
    );
  }

  const cartId = await getCartId();
  const cart = cartId ? await getCartWithItems() : null;
  if (!cart || cart.items.length === 0) {
    return actionError("Votre panier est vide.");
  }

  const unavailable = cart.items.filter(
    (item) => !item.product.isActive || !isOrderable(item.product.availability),
  );
  if (unavailable.length > 0) {
    return actionError(
      `Ces produits ne sont plus disponibles, merci de les retirer du panier : ${unavailable
        .map((i) => i.product.name)
        .join(", ")}`,
    );
  }

  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum + getUnitPrice(item.product.price, item.product.priceTiers, item.quantity) * item.quantity,
    0,
  );

  // Le client ne choisit plus de zone : elle est déduite ici de la ville
  // (seule Yaoundé a une zone/tarifs dédiés), jamais reprise d'une valeur
  // envoyée par le navigateur.
  let shippingFee = 0;
  let deliveryZoneId: string | undefined;
  if (parsed.data.deliveryMethod === "EXPEDITION") {
    const settings = await getSiteSettings();
    shippingFee = Math.round((subtotal * settings.expeditionFeePercent) / 100);
  } else if (parsed.data.deliveryMethod !== "PICKUP") {
    const zone = await db.deliveryZone.findFirst({
      where: { name: YAOUNDE_CITY, isActive: true },
    });
    if (!zone) {
      return actionError("Livraison à Yaoundé indisponible pour le moment, contactez-nous.");
    }
    const rate = await db.shippingRate.findFirst({
      where: { zoneId: zone.id, method: parsed.data.deliveryMethod },
    });
    if (!rate) {
      return actionError("Aucun tarif de livraison trouvé pour ce mode.");
    }
    deliveryZoneId = zone.id;
    shippingFee = rate.freeAbove && subtotal >= rate.freeAbove ? 0 : rate.price;
  }

  const total = subtotal + shippingFee;
  const orderNumber = generateOrderNumber();

  // Rattache la commande au compte du client s'il est connecté, pour qu'il
  // la retrouve dans "Mes commandes" — reste une commande invité valide
  // sinon (customerId optionnel), conformément au cahier des charges.
  const currentUser = await getCurrentUser();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: currentUser?.id,
        guestName: parsed.data.guestName,
        guestPhone: parsed.data.guestPhone,
        subtotal,
        shippingFee,
        total,
        deliveryZoneId,
        region: parsed.data.region,
        address: parsed.data.address,
        city: parsed.data.city,
        deliveryMethod: parsed.data.deliveryMethod,
        paymentMethod: parsed.data.paymentMethod,
        notes: parsed.data.notes,
        orderStatus: "NEW",
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPrice: getUnitPrice(item.product.price, item.product.priceTiers, item.quantity),
            quantity: item.quantity,
          })),
        },
        statusHistory: {
          create: { toStatus: "NEW" },
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  const notifyPayload = {
    title: "Nouvelle commande",
    body: `${formatOrderReference(order.sequenceNumber)} — ${parsed.data.guestName}`,
    url: `/admin/commandes/${order.id}`,
  };
  await Promise.all([notifyRole("ADMIN", notifyPayload), notifyRole("SUPER_ADMIN", notifyPayload)]);

  // Le panier vient d'être vidé (cart.deleteMany ci-dessus) : sans ça, le
  // compteur dans le header (lu depuis le layout) reste figé sur l'ancien
  // total jusqu'au prochain ajout au panier ailleurs sur le site.
  revalidatePath("/", "layout");

  return actionSuccess({ orderNumber: order.orderNumber });
}

const CHANNEL_BY_PAYMENT_METHOD: Record<string, string> = {
  NOTCHPAY_MTN: "cm.mtn",
  NOTCHPAY_ORANGE: "cm.orange",
};

/**
 * Deuxième étape du paiement Mobile Money : initie la transaction NotchPay
 * pour une commande déjà créée (paymentStatus PENDING) et renvoie l'URL de
 * paiement hébergée vers laquelle rediriger le client.
 */
export async function initiatePaymentForOrder(
  orderNumber: string,
): Promise<ActionResult<{ redirectUrl: string }>> {
  if (!(await checkPublicActionRateLimit("pay", await getClientIp(), 30))) {
    return actionError("Trop de demandes. Réessayez dans quelques minutes.");
  }
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return actionError("Commande introuvable.");

  // Un paiement n'est (re)lancé que pour une commande réellement en attente de
  // paiement : jamais pour une commande déjà payée, échouée ou annulée.
  if (order.paymentStatus === "PAID") return actionError("Cette commande est déjà payée.");
  if (order.orderStatus === "CANCELLED") return actionError("Cette commande a été annulée.");

  const channel = CHANNEL_BY_PAYMENT_METHOD[order.paymentMethod];
  if (!channel) {
    return actionError("Cette commande n'utilise pas un moyen de paiement Mobile Money.");
  }

  try {
    const provider = getActiveMobileMoneyProvider();
    const result = await provider.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: "XAF",
      customerPhone: order.guestPhone,
      customerName: order.guestName,
      channel,
    });

    await db.payment.upsert({
      where: { providerReference: result.providerReference },
      update: { rawPayload: result.raw as object },
      create: {
        orderId: order.id,
        provider: provider.type,
        providerReference: result.providerReference,
        amount: order.total,
        status: "PENDING",
        rawPayload: result.raw as object,
      },
    });

    if (!result.redirectUrl) {
      return actionError("Le service de paiement n'a pas renvoyé de lien de paiement.");
    }

    return actionSuccess({ redirectUrl: result.redirectUrl });
  } catch (error) {
    console.error("Échec de l'initialisation du paiement Mobile Money", error);
    return actionError(
      "Impossible de démarrer le paiement Mobile Money pour le moment. Réessayez ou choisissez le paiement à la livraison.",
    );
  }
}

export async function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      deliveryZone: true,
    },
  });
}

/** Derniers chiffres utiles d'un numéro camerounais, pour comparer deux
 * saisies qui diffèrent juste par le préfixe +237 ou des espaces. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

function findOrderForTracking(sequenceNumber: number) {
  return db.order.findUnique({
    where: { sequenceNumber },
    include: { items: true, deliveryZone: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
}

/**
 * Suivi public d'une commande (client invité, pas de compte) : référence
 * courte + téléphone utilisé à la commande. Les deux sont nécessaires —
 * la référence seule est courte et donc devinable, jamais acceptée seule.
 * Message d'erreur volontairement générique dans tous les cas d'échec, pour
 * ne jamais indiquer si c'est la référence ou le téléphone qui est faux.
 */
export async function trackOrder(
  referenceInput: string,
  phoneInput: string,
): Promise<ActionResult<NonNullable<Awaited<ReturnType<typeof findOrderForTracking>>>>> {
  const sequenceNumber = parseOrderReference(referenceInput);
  if (!sequenceNumber || !phoneInput.trim()) {
    return actionError("Merci de renseigner la référence et le numéro de téléphone.");
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await checkTrackingRateLimit(ip, String(sequenceNumber));
  if (!allowed) {
    return actionError("Trop de tentatives. Réessayez dans quelques minutes.");
  }

  const order = await findOrderForTracking(sequenceNumber);

  if (!order || normalizePhone(order.guestPhone) !== normalizePhone(phoneInput)) {
    return actionError("Aucune commande trouvée avec cette référence et ce numéro de téléphone.");
  }

  return actionSuccess(order);
}

/** Historique des commandes du client connecté ("Mes commandes"). */
export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}
