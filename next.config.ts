import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages publiques servies depuis le cache/CDN, parties personnelles en flux.
  cacheComponents: true,
  // Profil de cache du catalogue et des paramètres du site : une modification
  // faite dans l'admin est visible tout de suite (updateTag), et même si cette
  // invalidation ne parvenait pas jusqu'à une instance, la donnée est
  // revalidée au bout de 5 minutes (valeur modérée pour laisser la base Neon
  // se rendormir : chaque revalidation la réveille). "stale" borne le temps pendant lequel un
  // navigateur réutilise une page déjà vue sans interroger le serveur (30 s au
  // lieu de 5 min par défaut).
  cacheLife: {
    catalog: { stale: 30, revalidate: 300, expire: 3600 },
  },
  partialPrefetching: false,
  images: {
    // Photos de bannière et logo : rarement remplacés. Conservés 31 jours dans le
    // cache d'images (au lieu de 4 h par défaut) pour limiter les
    // transformations facturables. Pour remplacer une photo, lui donner un
    // nouveau nom de fichier.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Médiathèque Cloudinary — prêt pour une migration future vers
    // next/image (actuellement des <img> classiques sont utilisés, car
    // Cloudinary sert déjà des URLs optimisées).
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    // Politique de sécurité du contenu : bloque les scripts/objets/cadres venus
    // d'ailleurs. 'unsafe-inline' reste nécessaire pour les scripts et styles
    // que Next.js insère lui-même dans la page (pas de nonce avec le rendu
    // statique) ; tout le reste est restreint à notre domaine, Cloudinary et
    // les passerelles de paiement.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "media-src 'self' blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    // En-têtes de base contre le clickjacking / MIME-sniffing / fuite de
    // referrer. Pas de Content-Security-Policy ici : une CSP stricte casse
    // facilement des fonctionnalités (widgets de paiement, styles injectés
    // par Tailwind/React) et doit être testée soigneusement avant d'être
    // activée en production — à faire dans une passe dédiée, pas à la volée.
    return [
      {
        // Logo et photos de bannière : rarement remplacés, mis en cache un jour
        // (servis ensuite immédiatement pendant une semaine le temps de vérifier).
        source: "/:file(logo|hero|boutique|categories).png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        // Factures, reçus et pages de commande : données personnelles accessibles
        // par un lien — jamais gardées en cache partagé, jamais indexées.
        source: "/api/commandes/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/commande/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
