import { z } from "zod";
import { passwordSchema } from "./auth";

// Création de comptes internes (admin/livreur) depuis l'administration —
// distinct de l'inscription client (register.ts) : jamais de rôle CUSTOMER
// ici, et seul un SUPER_ADMIN peut le faire (cf. server/actions/admin-users.ts).
export const staffUserSchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  email: z.email("Adresse email invalide"),
  password: passwordSchema,
  role: z.enum(["ADMIN", "SUPER_ADMIN", "DELIVERY"]),
});

export type StaffUserInput = z.infer<typeof staffUserSchema>;
