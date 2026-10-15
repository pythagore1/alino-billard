"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guard";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// Le serveur enverra une requête à cette adresse à chaque notification : sans
// contrôle, un client pourrait y mettre n'importe quel site (y compris interne).
// On n'accepte que les services push des navigateurs.
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
  "push.microsoft.com",
];

const pushSubscriptionSchema = z.object({
  endpoint: z
    .url({ protocol: /^https$/ })
    .max(1000)
    .refine((value) => {
      const host = new URL(value).hostname;
      return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
    }, "Service de notification non reconnu."),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(100),
  }),
});

/**
 * Enregistre (ou met à jour) l'abonnement push d'un appareil pour
 * l'utilisateur connecté. Un abonnement déjà rattaché à un AUTRE compte n'est
 * jamais repris : sinon, connaître l'adresse d'un appareil suffirait à
 * détourner les notifications de son propriétaire.
 */
export async function subscribeToPush(subscription: PushSubscriptionInput): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return actionError("Connectez-vous pour activer les notifications.");

  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) return actionError("Abonnement aux notifications invalide.");
  const { endpoint, keys } = parsed.data;

  const existing = await db.pushSubscription.findUnique({ where: { endpoint } });
  if (existing && existing.userId !== user.id) {
    return actionError("Cet appareil est déjà utilisé par un autre compte.");
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return actionSuccess(null);
}

export async function unsubscribeFromPush(endpoint: string): Promise<ActionResult<null>> {
  // Connexion requise et abonnement restreint à son propriétaire : sans cela,
  // quiconque connaîtrait l'adresse d'un appareil pourrait le désabonner.
  const user = await getCurrentUser();
  if (!user) return actionError("Connexion requise.");
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return actionSuccess(null);
}

export async function getMyNotifications(limit = 20) {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return db.notification.count({ where: { userId: user.id, isRead: false } });
}

export async function markNotificationRead(id: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return actionError("Non connecté.");
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
  return actionSuccess(null);
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return actionError("Non connecté.");
  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return actionSuccess(null);
}
