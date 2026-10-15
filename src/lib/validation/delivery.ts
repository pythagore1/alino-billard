import { z } from "zod";

export const deliveryZoneSchema = z.object({
  name: z.string().min(2, "Nom de zone requis"),
});

export const shippingRateSchema = z.object({
  zoneId: z.string().cuid(),
  method: z.enum(["STANDARD", "EXPRESS"]),
  price: z.number().int().min(0),
  freeAbove: z.number().int().positive().optional(),
});
