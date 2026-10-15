import "server-only";
import { db } from "@/lib/db";

/**
 * Trace les actions admin sensibles (créations/modifications/suppressions de
 * produits, catégories, services, paramètres...) — exigé par le cahier des
 * charges (section 15 : "Logs des actions admin"). Ne doit jamais bloquer
 * l'action métier elle-même si l'écriture du log échoue.
 */
export async function logAudit(params: {
  userId: string | undefined;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before === undefined ? undefined : (params.before as object),
        after: params.after === undefined ? undefined : (params.after as object),
      },
    });
  } catch (error) {
    console.error("Échec de l'écriture du journal d'audit", error);
  }
}
