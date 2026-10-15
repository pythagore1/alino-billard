import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

// Étend les types Auth.js pour exposer le rôle et l'id ALINO-Billard sur la
// session et le token JWT — nécessaire pour le contrôle d'accès admin/livreur.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      pwf: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    pwf?: string;
  }
}

// `next-auth/jwt` ne fait que ré-exporter `@auth/core/jwt` (`export * from`) :
// l'augmentation de type doit cibler le module où l'interface JWT est
// réellement déclarée, sinon les callbacks internes d'Auth.js (qui importent
// directement depuis "@auth/core/jwt") ne voient pas nos champs ajoutés.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    pwf: string;
  }
}
