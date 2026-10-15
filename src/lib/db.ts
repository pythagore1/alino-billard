import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Réglages pour des fonctions serverless qui parlent à Neon via son pooler :
// nombre de connexions limité par instance, fermeture des connexions inactives AVANT que
// le pooler ne les coupe (sinon la suivante échoue avec « Connection terminated
// unexpectedly »), keep-alive TCP, et un délai de connexion borné.
const adapter = new PrismaPg(
  {
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
  },
  {
    onPoolError: (error) => console.error("[db] erreur du pool de connexions :", error.message),
    onConnectionError: (error) => console.error("[db] connexion perdue :", error.message),
  },
);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
