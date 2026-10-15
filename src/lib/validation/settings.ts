import { z } from "zod";

export const siteSettingsSchema = z.object({
  storeName: z.string().min(2),
  logoUrl: z.url({ protocol: /^https$/ }).optional().or(z.literal("")),
  whatsappNumber: z.string().optional().or(z.literal("")),
  mtnNumber: z.string().optional().or(z.literal("")),
  orangeNumber: z.string().optional().or(z.literal("")),
  contactEmail: z.email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  taxEnabled: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(19.25),
  currency: z.string().min(3).max(3).default("XAF"),
  freeShippingThreshold: z.number().int().positive().optional(),
  expeditionFeePercent: z.number().min(0).max(100).default(10),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
