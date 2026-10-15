"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Mesure de fréquentation sans cookie. On n'envoie jamais l'administration ni les
// pages contenant un numéro de commande ou des données de compte.
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const path = new URL(event.url).pathname;
  if (path.startsWith("/admin") || path.startsWith("/commande/confirmation") || path.startsWith("/compte")) {
    return null;
  }
  return event;
}

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
