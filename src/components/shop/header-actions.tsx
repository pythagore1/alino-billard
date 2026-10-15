import Link from "next/link";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MobileTabBar } from "@/components/shop/mobile-tab-bar";
import { getShopSession } from "@/components/shop/shop-session";

/** Compte et panier de l'en-tête (bureau). Présentation seule : pas d'accès aux cookies. */
export function HeaderActions({ loggedIn, cartCount }: { loggedIn: boolean; cartCount: number }) {
  return (
    <>
      {loggedIn && <NotificationBell />}
      <Link
        href={loggedIn ? "/compte" : "/compte/connexion"}
        className="hidden hover:text-primary lg:inline"
      >
        {loggedIn ? "Mes commandes" : "Mon compte"}
      </Link>
      <Link
        href="/panier"
        className="hidden items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary lg:flex"
      >
        <span aria-hidden>🛒</span>
        Panier
        {cartCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {cartCount}
          </span>
        )}
      </Link>
    </>
  );
}

/** Version personnalisée : lit la session et le panier du visiteur (à placer sous <Suspense>). */
export async function HeaderActionsLive() {
  const { user, cartCount } = await getShopSession();
  return <HeaderActions loggedIn={Boolean(user)} cartCount={cartCount} />;
}

/** Barre du bas (mobile) avec le badge du panier et le bon lien « Compte ». */
export async function TabBarLive() {
  const { user, cartCount } = await getShopSession();
  return <MobileTabBar cartCount={cartCount} accountHref={user ? "/compte" : "/compte/connexion"} />;
}
