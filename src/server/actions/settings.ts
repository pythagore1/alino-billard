"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation/settings";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

// Seul un SUPER_ADMIN modifie les paramètres globaux de la boutique (section
// 5 du cahier des charges : rôles/permissions).
export async function updateSiteSettings(
  input: SiteSettingsInput,
): Promise<ActionResult<null>> {
  const session = await requireRole(["SUPER_ADMIN"]);

  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const existing = await getSiteSettings();

  await db.siteSettings.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl || null,
      whatsappNumber: parsed.data.whatsappNumber || null,
      mtnNumber: parsed.data.mtnNumber || null,
      orangeNumber: parsed.data.orangeNumber || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "settings.update",
    entityType: "SiteSettings",
    entityId: existing.id,
    before: existing,
    after: parsed.data,
  });

  revalidatePath("/admin/parametres");
  revalidatePath("/");
  updateTag("settings");
  return actionSuccess(null);
}
