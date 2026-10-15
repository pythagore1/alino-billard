"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToPush,
} from "@/server/actions/notifications";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  isRead: boolean;
  createdAt: Date;
};

const POLL_INTERVAL_MS = 60_000;

// Format attendu par PushManager.subscribe : la clé VAPID publique doit être
// convertie de base64url vers un Uint8Array (l'API navigateur ne prend pas
// la chaîne brute).
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function refreshUnreadCount(setUnreadCount: (count: number) => void) {
  const count = await getUnreadNotificationCount();
  setUnreadCount(count);
}

async function registerAndSubscribe() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  const registration = await navigator.serviceWorker.register("/sw.js");
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await subscribeToPush(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | null>(() =>
    typeof Notification === "undefined" ? null : Notification.permission,
  );

  useEffect(() => {
    if (permission === "granted") {
      registerAndSubscribe().catch(() => {});
    }

    // On n'interroge le serveur que lorsque l'onglet est visible : un onglet
    // oublié en arrière-plan ne doit pas solliciter la base toutes les 30 s.
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refreshUnreadCount(setUnreadCount);
    };
    refreshIfVisible();
    const interval = setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [permission]);

  async function handleEnableNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result); // ré-exécute l'effet ci-dessus, qui gère l'abonnement si "granted"
  }

  async function handleToggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      const items = await getMyNotifications();
      setNotifications(items);
    }
  }

  async function handleNotificationClick(item: NotificationItem) {
    if (!item.isRead) {
      await markNotificationRead(item.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    }
    setOpen(false);
    if (item.url) router.push(item.url);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="relative rounded p-2 hover:bg-surface-muted"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Referme au tap/clic en dehors, et évite que le contenu derrière
              (ex. le menu admin) ne reste visible/cliquable autour du panneau
              sur un écran étroit, où le panneau ne peut pas couvrir toute la
              largeur. */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Ancré au bouton cloche sur grand écran (assez de place à droite),
              mais fixé aux bords de l'écran sur mobile : la cloche n'est pas
              forcément collée au bord droit (ex. lien "Se déconnecter" juste
              à côté), donc un panneau ancré au bouton peut déborder à gauche
              de l'écran sur un petit viewport. */}
          <div className="fixed inset-x-4 top-16 z-50 rounded-lg border border-border bg-surface shadow-lg sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80">
            {permission === "default" && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="block w-full border-b border-border px-4 py-2 text-left text-xs text-primary hover:bg-surface-muted"
              >
                Activer les notifications sur cet appareil
              </button>
            )}

            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-medium">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Aucune notification.</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`block w-full border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-surface-muted ${
                      item.isRead ? "" : "bg-primary/5"
                    }`}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.body}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
