import { z } from "zod";

export const quoteRequestSchema = z.object({
  serviceId: z.string().cuid(),
  guestName: z.string().min(2, "Nom requis").max(100),
  guestPhone: z.string().min(9, "Numéro de téléphone invalide").max(20),
  description: z.string().min(10, "Décrivez un peu plus votre demande (10 caractères minimum)").max(2000, "Description trop longue"),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const serviceBookingSchema = z.object({
  serviceId: z.string().cuid(),
  guestName: z.string().min(2, "Nom requis").max(100),
  guestPhone: z.string().min(9, "Numéro de téléphone invalide").max(20),
  address: z.string().min(5, "Adresse requise").max(300),
  requestedSlot: z.string().min(1, "Choisissez une date souhaitée").max(100),
  notes: z.string().max(500).optional(),
});

export type ServiceBookingInput = z.infer<typeof serviceBookingSchema>;
