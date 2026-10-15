// Service worker minimal : uniquement les notifications push (pas de cache
// offline — hors scope ici). Doit rester à la racine de /public pour que son
// scope couvre tout le site (les service workers ne peuvent pas remonter
// au-dessus du dossier où ils sont servis).

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ALINO-Billard", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "ALINO-Billard", {
      body: payload.body,
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
