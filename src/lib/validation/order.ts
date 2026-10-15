import { z } from "zod";
import { CAMEROON_REGIONS, CITIES_BY_REGION, isYaounde } from "@/lib/cameroon-locations";

// Format camerounais : 9 chiffres commençant par 6 (mobile), avec ou sans
// indicatif +237 et espaces de séparation facultatifs.
const PHONE_REGEX = /^(\+?237)?\s*6\d{2}\s*\d{2}\s*\d{2}\s*\d{2}$/;

export const cartItemInputSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().min(1).max(50),
});

export type CartItemInput = z.infer<typeof cartItemInputSchema>;

// Commande invité autorisée (cahier des charges) : seuls le nom et le
// téléphone sont obligatoires, le compte client reste optionnel. Les
// articles ne sont volontairement PAS pris depuis le client : createOrder
// relit le panier côté serveur (via le cookie) pour ne jamais faire
// confiance à des prix ou quantités envoyés par le navigateur.
const baseCheckoutSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(3, "Nom trop court")
    .max(100, "Nom trop long")
    .regex(/^[\p{L}][\p{L}\s'-]*$/u, "Le nom ne doit contenir que des lettres"),
  guestPhone: z.string().trim().regex(PHONE_REGEX, "Numéro invalide (format : 6XX XX XX XX)"),
  region: z.enum(CAMEROON_REGIONS, { message: "Région requise" }),
  city: z.string().min(2, "Ville requise").max(80),
  address: z.string().trim().min(5, "Quartier requis").max(300, "Adresse trop longue"),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS", "PICKUP", "EXPEDITION"]),
  paymentMethod: z.enum(["NOTCHPAY_MTN", "NOTCHPAY_ORANGE", "CASH_ON_DELIVERY"]),
  notes: z.string().max(500).optional(),
});

// Règles croisées région/ville <-> mode de livraison/paiement : seule
// Yaoundé a la livraison standard/express/retrait + le paiement à la
// livraison, tout le reste du pays est en "Expédition" + Mobile Money
// uniquement. Vérifié ici (serveur) et pas seulement dans le formulaire,
// pour qu'un appel direct à createOrder() ne puisse pas contourner la règle.
export const checkoutSchema = baseCheckoutSchema
  .refine((data) => CITIES_BY_REGION[data.region]?.includes(data.city), {
    message: "Ville invalide pour cette région",
    path: ["city"],
  })
  .refine(
    (data) =>
      isYaounde(data.city)
        ? data.deliveryMethod !== "EXPEDITION"
        : data.deliveryMethod === "EXPEDITION",
    { message: "Mode de livraison invalide pour cette ville", path: ["deliveryMethod"] },
  )
  .refine((data) => isYaounde(data.city) || data.paymentMethod !== "CASH_ON_DELIVERY", {
    message: "Le paiement à la livraison n'est disponible qu'à Yaoundé",
    path: ["paymentMethod"],
  });

export type CheckoutInput = z.infer<typeof baseCheckoutSchema>;
