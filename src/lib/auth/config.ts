import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { normalizePhone, phoneCandidates } from "@/lib/phone";
import { checkCredentialsRateLimit } from "@/lib/rate-limit";
import { passwordFingerprint } from "@/lib/auth/fingerprint";

// Hash bcrypt valide mais jamais rattaché à un compte réel : comparé même
// quand l'utilisateur n'existe pas ou est désactivé, pour que authorize()
// prenne un temps constant dans tous les cas. Sans ça, un email inexistant
// répond immédiatement (pas de bcrypt.compare) alors qu'un email existant
// prend ~100ms+ (coût bcrypt) — fuite d'information exploitable pour énumérer
// les comptes (relevé par l'audit sécurité).
const DUMMY_PASSWORD_HASH = "$2b$12$wchNzdnZpskYqfa72ASpZ.nbfgiNdBRIaNQORjpxXLclcGtLc.1he";

// Le Proxy (ex-middleware) de Next.js 16 tourne sur le runtime Node.js (pas
// Edge), donc Prisma peut être utilisé directement ici sans configuration
// séparée "edge-safe" — inutile de scinder authConfig comme sur les anciennes
// versions d'Auth.js.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: {
    signIn: "/compte/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email ou téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Limite de tentatives appliquée ICI (et pas seulement dans l'action de la
        // page de connexion) : la route /api/auth/callback/credentials est publique
        // et permettrait sinon d'essayer des mots de passe sans aucun frein.
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const key = parsed.data.identifier.includes("@")
          ? parsed.data.identifier.toLowerCase()
          : normalizePhone(parsed.data.identifier);
        if (!(await checkCredentialsRateLimit(ip, key))) return null;

        // Un compte peut n'avoir qu'un email ou qu'un téléphone (inscription
        // par numéro seul) — on cherche sur les deux champs, chacun unique.
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: parsed.data.identifier },
              { phone: { in: phoneCandidates(parsed.data.identifier) } },
            ],
          },
        });

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );

        if (!user || !user.isActive || !passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          pwf: passwordFingerprint(user.passwordHash),
        };
      },
    }),
  ],
  callbacks: {
    // Recopie l'id et le rôle dans le token JWT à la connexion...
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.pwf = user.pwf ?? "";
      }
      return token;
    },
    // ...puis du token vers la session exposée au reste de l'application.
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.pwf = token.pwf;
      return session;
    },
  },
});
