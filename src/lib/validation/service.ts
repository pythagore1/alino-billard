import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Le slug doit être en minuscules avec des tirets"),
  description: z.string().optional(),
  pricingType: z.enum(["FIXED", "STARTING_AT", "QUOTE_ONLY"]),
  price: z.number().int().positive().optional(),
  durationEstimate: z.string().optional(),
  interventionZone: z.string().optional(),
  isBookable: z.boolean().default(true),
  isQuotable: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
