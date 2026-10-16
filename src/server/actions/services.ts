"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";
import { serviceSchema, type ServiceInput } from "@/lib/validation/service";
import {
  quoteRequestSchema,
  serviceBookingSchema,
  type QuoteRequestInput,
  type ServiceBookingInput,
} from "@/lib/validation/service-request";
import { checkPublicActionRateLimit, getClientIp } from "@/lib/rate-limit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

// Démo ALINO : le catalogue est réservé au SUPER_ADMIN (maintenance). Les ADMIN ne gèrent que les commandes.
const CAN_MANAGE_CATALOG = ["SUPER_ADMIN"] as const;

// --- Lecture publique (boutique) ---------------------------------------

export async function getActiveServices() {
  return db.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { images: { where: { isPrimary: true }, include: { media: true }, take: 1 } },
  });
}

export async function getServiceBySlug(slug: string) {
  return db.service.findFirst({
    where: { slug, isActive: true },
    include: { images: { include: { media: true }, orderBy: { position: "asc" } } },
  });
}

/** Demande de devis (section 24 du cahier des charges) — pas de compte requis. */
export async function submitQuoteRequest(
  input: QuoteRequestInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }
  if (!(await checkPublicActionRateLimit("quote", await getClientIp(), 15))) {
    return actionError("Trop de demandes. Réessayez dans quelques minutes.");
  }

  const service = await db.service.findUnique({ where: { id: parsed.data.serviceId } });
  if (!service || !service.isActive || !service.isQuotable) {
    return actionError("Ce service n'accepte pas les demandes de devis.");
  }

  const quote = await db.quoteRequest.create({ data: parsed.data });
  revalidatePath("/admin/services/demandes-devis");
  return actionSuccess({ id: quote.id });
}

/** Prise de rendez-vous (section 24) — pas de compte requis. */
export async function submitServiceBooking(
  input: ServiceBookingInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = serviceBookingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }
  if (!(await checkPublicActionRateLimit("booking", await getClientIp(), 15))) {
    return actionError("Trop de demandes. Réessayez dans quelques minutes.");
  }

  const service = await db.service.findUnique({ where: { id: parsed.data.serviceId } });
  if (!service || !service.isActive || !service.isBookable) {
    return actionError("Ce service n'accepte pas les prises de rendez-vous en ligne.");
  }

  const requestedSlot = new Date(parsed.data.requestedSlot);
  if (Number.isNaN(requestedSlot.getTime())) {
    return actionError("Date souhaitée invalide.");
  }

  const booking = await db.serviceBooking.create({
    data: { ...parsed.data, requestedSlot },
  });
  revalidatePath("/admin/services/rendez-vous");
  return actionSuccess({ id: booking.id });
}

// --- Administration ------------------------------------------------------

export async function listServicesForAdmin() {
  await requireRole([...CAN_MANAGE_CATALOG]);
  return db.service.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { bookings: true, quotes: true } } },
  });
}

export async function getServiceForAdmin(id: string) {
  await requireRole([...CAN_MANAGE_CATALOG]);
  return db.service.findUnique({
    where: { id },
    include: { images: { include: { media: true }, orderBy: { position: "asc" } } },
  });
}

type ServiceFormInput = Omit<ServiceInput, "slug"> & { slug?: string };

export async function createService(
  input: ServiceFormInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const parsed = serviceSchema.safeParse({ ...input, slug });
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const slugTaken = await db.service.findUnique({ where: { slug } });
  if (slugTaken) return actionError("Ce slug est déjà utilisé par un autre service.");

  const service = await db.service.create({ data: parsed.data });

  await logAudit({
    userId: session.user.id,
    action: "service.create",
    entityType: "Service",
    entityId: service.id,
    after: service,
  });

  revalidatePath("/admin/services");
  return actionSuccess({ id: service.id });
}

export async function updateService(
  id: string,
  input: ServiceFormInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return actionError("Service introuvable.");

  const slug = input.slug?.trim() ? slugify(input.slug) : existing.slug;
  const parsed = serviceSchema.safeParse({ ...input, slug });
  if (!parsed.success) {
    return actionError("Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  const slugTaken = await db.service.findFirst({ where: { slug, NOT: { id } } });
  if (slugTaken) return actionError("Ce slug est déjà utilisé par un autre service.");

  const service = await db.service.update({ where: { id }, data: parsed.data });

  await logAudit({
    userId: session.user.id,
    action: "service.update",
    entityType: "Service",
    entityId: id,
    before: existing,
    after: service,
  });

  revalidatePath("/admin/services");
  return actionSuccess({ id: service.id });
}

export async function toggleServiceActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return actionError("Service introuvable.");

  const service = await db.service.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    userId: session.user.id,
    action: service.isActive ? "service.activate" : "service.deactivate",
    entityType: "Service",
    entityId: id,
  });

  revalidatePath("/admin/services");
  return actionSuccess({ isActive: service.isActive });
}

export async function deleteService(id: string): Promise<ActionResult<null>> {
  const session = await requireRole([...CAN_MANAGE_CATALOG]);

  const existing = await db.service.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true, quotes: true } } },
  });
  if (!existing) return actionError("Service introuvable.");

  if (existing._count.bookings > 0 || existing._count.quotes > 0) {
    return actionError(
      "Impossible de supprimer un service ayant déjà des réservations ou demandes de devis. Désactive-le plutôt.",
    );
  }

  await db.service.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "service.delete",
    entityType: "Service",
    entityId: id,
    before: existing,
  });

  revalidatePath("/admin/services");
  return actionSuccess(null);
}
