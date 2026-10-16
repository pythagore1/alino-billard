import { requireRole } from "@/lib/auth/guard";

// Section réservée au SUPER_ADMIN (maintenance) : les ADMIN ne gèrent que les commandes.
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireRole(["SUPER_ADMIN"]);
  return children;
}
