import { requireRole } from "@/lib/auth/guard";
import { getSiteSettings } from "@/lib/site-settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  // Seul un SUPER_ADMIN modifie les paramètres globaux (cf. matrice de
  // permissions définie dans le plan d'architecture, section 5).
  await requireRole(["SUPER_ADMIN"]);
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Paramètres de la boutique</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
