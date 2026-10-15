import { z } from "zod";

// Règle volontairement simple (8 caractères minimum) : le marché camerounais
// utilise beaucoup les téléphones bas de gamme, une règle trop stricte (symboles
// obligatoires, etc.) augmente l'abandon à l'inscription sans gain de sécurité
// réel tant que le hashage (bcrypt, coût 12) est correct côté serveur.
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  // bcrypt ignore tout ce qui dépasse 72 octets : on borne pour éviter les surprises.
  .max(72, "Le mot de passe est trop long (72 caractères maximum)");

// Email ET téléphone optionnels au niveau du champ individuel : c'est le
// .refine() ci-dessous qui impose qu'au moins l'un des deux soit fourni —
// un client doit pouvoir créer un compte avec juste son numéro, très courant
// sur ce marché où tout le monde n'a pas d'adresse email.
export const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom est trop court").max(100),
    email: z.email("Adresse email invalide").optional().or(z.literal("")),
    phone: z
      .string()
      .min(9, "Numéro de téléphone invalide")
      .max(20)
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: "Indiquez au moins un e-mail ou un numéro de téléphone.",
    path: ["email"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Connexion par email OU téléphone (identifiant unique en base pour les deux
// — voir prisma/schema.prisma) : on ne force pas le format email ici, la
// distinction se fait dans authorize() (src/lib/auth/config.ts).
export const loginSchema = z.object({
  identifier: z.string().min(3, "Email ou téléphone requis").max(120),
  password: z.string().min(1, "Mot de passe requis").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
