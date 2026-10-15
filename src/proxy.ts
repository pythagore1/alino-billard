import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

// Rôles autorisés à entrer dans /admin. Le rôle DELIVERY (livreur) y a accès
// pour son propre espace restreint — le contrôle fin (quelles pages il peut
// voir) se fait ensuite dans chaque Server Action, pas seulement ici (voir
// note Next.js: ne jamais compter uniquement sur le Proxy pour la sécurité).
const ADMIN_AREA_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "DELIVERY"]);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  if (!isAdminRoute) return NextResponse.next();

  const role = request.auth?.user?.role;
  if (!role || !ADMIN_AREA_ROLES.has(role)) {
    const signInUrl = new URL("/compte/connexion", request.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
