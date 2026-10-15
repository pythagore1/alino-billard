import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

// `toLocaleString("fr-FR")` utilise l'espace fine insécable (U+202F) comme
// séparateur de milliers, pas une espace normale — on construit l'attendu
// avec le même appel plutôt que de coder le caractère en dur dans le test.
describe("formatPrice", () => {
  it("formate en FCFA avec séparateur de milliers", () => {
    expect(formatPrice(5000)).toBe(`${(5000).toLocaleString("fr-FR")} FCFA`);
    expect(formatPrice(185000)).toBe(`${(185000).toLocaleString("fr-FR")} FCFA`);
  });

  it("gère zéro", () => {
    expect(formatPrice(0)).toBe("0 FCFA");
  });

  it("contient bien le montant et le suffixe devise", () => {
    const result = formatPrice(65000);
    expect(result).toContain("65");
    expect(result).toContain("000");
    expect(result.endsWith("FCFA")).toBe(true);
  });
});
