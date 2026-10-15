import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/auth/guard";
import { signOutAction } from "@/server/actions/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { NotificationBell } from "@/components/shared/notification-bell";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  DELIVERY: "Livreur",
};

// L'administration est entièrement personnelle (session, base) : on la place
// sous <Suspense> pour que Next.js puisse servir la coquille tout de suite.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-muted" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  // Deuxième vérification côté serveur, indépendante du Proxy (src/proxy.ts).
  const session = await requireRole(["ADMIN", "SUPER_ADMIN", "DELIVERY"]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <p className="font-semibold">ALINO-Billard — Administration</p>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · {ROLE_LABELS[session.user.role] ?? session.user.role}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <form action={signOutAction}>
            <button type="submit" className="text-sm underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <AdminNav role={session.user.role} />
      <main className="p-6">{children}</main>
    </div>
  );
}
