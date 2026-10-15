import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Enregistre toujours la notification en base (source de vérité pour la
 * cloche, visible même sans permission navigateur accordée), puis tente
 * l'envoi push vers chaque appareil abonné. Un abonnement expiré/révoqué
 * (404/410) est silencieusement nettoyé — c'est l'état normal, pas une
 * erreur à faire remonter.
 */
export async function notifyUser(userId: string, payload: NotificationPayload): Promise<void> {
  await db.notification.create({
    data: { userId, title: payload.title, body: payload.body, url: payload.url },
  });

  if (!process.env.VAPID_PRIVATE_KEY) return; // push non configuré (ex. environnement local sans clés)

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Échec d'envoi de notification push", error);
        }
      }
    }),
  );
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  await Promise.all(userIds.map((userId) => notifyUser(userId, payload)));
}

/** Notifie tous les utilisateurs actifs d'un rôle (ex. tous les admins). */
export async function notifyRole(role: Role, payload: NotificationPayload): Promise<void> {
  const users = await db.user.findMany({ where: { role, isActive: true }, select: { id: true } });
  await notifyUsers(
    users.map((u) => u.id),
    payload,
  );
}
