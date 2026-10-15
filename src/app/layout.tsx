import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteAnalytics } from "@/components/site-analytics";

// Utilisée seulement pour les références de commande : chargée à la demande,
// pas préchargée sur chaque page.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

// Titres des pages boutique uniquement (voir .shop-theme dans globals.css) —
// l'admin reste en Geist Sans utilitaire.
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ALINO-Billard — Boutique de billard premium au Cameroun",
    template: "%s | ALINO-Billard",
  },
  description:
    "Queues, boules, procédés et accessoires de billard (8-ball, 9-ball, 10-ball) — livraison au Cameroun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
