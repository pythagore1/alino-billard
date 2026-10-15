import { describe, expect, it } from "vitest";
import { categorySchema, productSchema } from "./catalog";

describe("categorySchema", () => {
  it("accepte une catégorie valide", () => {
    const result = categorySchema.safeParse({
      name: "Queues de jeu",
      slug: "queues-de-jeu",
      position: 0,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un slug avec majuscules ou espaces", () => {
    const result = categorySchema.safeParse({
      name: "Queues de jeu",
      slug: "Queues De Jeu",
      position: 0,
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  const base = {
    name: "Queue Predator P3",
    slug: "queue-predator-p3",
    price: 185000,
    categoryId: "cabcdefghijklmnopqrstuvwx", // format cuid plausible
    availability: "AVAILABLE" as const,
    isFeatured: false,
    isActive: true,
  };

  it("accepte un produit valide", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it("rejette un prix négatif ou nul", () => {
    expect(productSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, price: -100 }).success).toBe(false);
  });

  it("rejette une disponibilité inconnue", () => {
    expect(productSchema.safeParse({ ...base, availability: "PEUT_ETRE" }).success).toBe(false);
  });
});
