import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("retire les accents", () => {
    expect(slugify("Étuis 2x2")).toBe("etuis-2x2");
    expect(slugify("Procédés médiums")).toBe("procedes-mediums");
  });

  it("nettoie les espaces et la ponctuation", () => {
    expect(slugify("  Boîtes de craies!! ")).toBe("boites-de-craies");
  });

  it("gère déjà les slugs propres sans les altérer", () => {
    expect(slugify("queues-de-jeu")).toBe("queues-de-jeu");
  });

  it("ne laisse jamais de tiret en début ou fin", () => {
    expect(slugify("!!Craies!!")).toBe("craies");
  });
});
