import { z } from "zod";

// Schémas partagés entre l'admin (création/édition produit) et, plus tard,
// toute validation côté client avant soumission — une seule source de vérité.

export const categorySchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Le slug doit être en minuscules avec des tirets (ex: queues-de-jeu)"),
  parentId: z.string().cuid().nullable().optional(),
  icon: z.string().max(8).optional(),
  imageUrl: z.string().url().optional(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// Les prix sont exprimés en FCFA (XAF), sans décimales — d'où des entiers.
export const productSchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Le slug doit être en minuscules avec des tirets"),
  shortDescription: z.string().max(300).optional(),
  description: z.string().optional(),
  price: z.number().int().positive("Le prix doit être positif"),
  compareAtPrice: z.number().int().positive().optional(),
  promoPrice: z.number().int().positive().optional(),
  promoStartsAt: z.date().optional(),
  promoEndsAt: z.date().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  categoryId: z.string().cuid("Catégorie invalide"),
  availability: z.enum([
    "AVAILABLE",
    "TO_CONFIRM",
    "ON_ORDER",
    "OUT_OF_STOCK",
    "DISABLED",
  ]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// Palier de prix dégressif : le prix de base (1 unité) reste `Product.price`,
// ces paliers ne couvrent que les seuils de quantité supérieurs.
export const priceTierSchema = z.object({
  minQuantity: z.number().int().min(2, "Le palier doit démarrer à partir d'au moins 2 unités"),
  unitPrice: z.number().int().positive("Le prix doit être positif"),
});

export type PriceTierInput = z.infer<typeof priceTierSchema>;
