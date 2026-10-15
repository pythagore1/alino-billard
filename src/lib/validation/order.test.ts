import { describe, expect, it } from "vitest";
import { checkoutSchema, cartItemInputSchema } from "./order";

describe("cartItemInputSchema", () => {
  it("accepte une quantité valide", () => {
    expect(
      cartItemInputSchema.safeParse({ productId: "cabcdefghijklmnopqrstuvwx", quantity: 2 }).success,
    ).toBe(true);
  });

  it("rejette une quantité de 0 ou supérieure à 50", () => {
    expect(
      cartItemInputSchema.safeParse({ productId: "cabcdefghijklmnopqrstuvwx", quantity: 0 }).success,
    ).toBe(false);
    expect(
      cartItemInputSchema.safeParse({ productId: "cabcdefghijklmnopqrstuvwx", quantity: 51 }).success,
    ).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const yaounde = {
    guestName: "Client Test",
    guestPhone: "+237 600 00 00 00",
    region: "Centre" as const,
    city: "Yaoundé",
    address: "Rue Test, derrière la pharmacie",
    deliveryMethod: "STANDARD" as const,
    paymentMethod: "CASH_ON_DELIVERY" as const,
  };

  const douala = {
    ...yaounde,
    region: "Littoral" as const,
    city: "Douala",
    deliveryMethod: "EXPEDITION" as const,
    paymentMethod: "NOTCHPAY_MTN" as const,
  };

  it("accepte une commande invité valide à Yaoundé (pas de compte requis)", () => {
    expect(checkoutSchema.safeParse(yaounde).success).toBe(true);
  });

  it("accepte une commande Expédition hors Yaoundé en Mobile Money", () => {
    expect(checkoutSchema.safeParse(douala).success).toBe(true);
  });

  it("rejette un quartier ou un nom trop courts", () => {
    expect(checkoutSchema.safeParse({ ...yaounde, guestName: "A" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...yaounde, address: "Ab" }).success).toBe(false);
  });

  it("rejette un numéro de téléphone mal formaté", () => {
    expect(checkoutSchema.safeParse({ ...yaounde, guestPhone: "123" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...yaounde, guestPhone: "+33612345678" }).success).toBe(false);
  });

  it("rejette un moyen de paiement inconnu", () => {
    expect(checkoutSchema.safeParse({ ...yaounde, paymentMethod: "VIREMENT" }).success).toBe(false);
  });

  it("rejette une ville qui n'appartient pas à la région choisie", () => {
    expect(checkoutSchema.safeParse({ ...yaounde, city: "Douala" }).success).toBe(false);
  });

  it("rejette le paiement à la livraison hors Yaoundé", () => {
    expect(
      checkoutSchema.safeParse({ ...douala, paymentMethod: "CASH_ON_DELIVERY" }).success,
    ).toBe(false);
  });

  it("rejette un mode de livraison Yaoundé (standard/express/retrait) hors Yaoundé", () => {
    expect(checkoutSchema.safeParse({ ...douala, deliveryMethod: "STANDARD" }).success).toBe(false);
  });

  it("rejette Expédition pour une commande à Yaoundé", () => {
    expect(checkoutSchema.safeParse({ ...yaounde, deliveryMethod: "EXPEDITION" }).success).toBe(
      false,
    );
  });
});
