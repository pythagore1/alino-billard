import { listStaffUsers } from "@/server/actions/admin-users";
import { StaffUserForm } from "@/components/admin/staff-user-form";
import { StaffUserRowActions } from "@/components/admin/staff-user-row-actions";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super administrateur",
  DELIVERY: "Livreur",
};

export default async function AdminUsersPage() {
  const users = await listStaffUsers();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 text-xl font-semibold">Comptes internes</h1>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Nom</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Statut</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3 text-muted-foreground">{user.email}</td>
                  <td className="p-3">{ROLE_LABELS[user.role]}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        user.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-muted text-muted-foreground"
                      }`}
                    >
                      {user.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="p-3">
                    <StaffUserRowActions userId={user.id} isActive={user.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Créer un compte</h2>
        <StaffUserForm />
      </div>
    </div>
  );
}
