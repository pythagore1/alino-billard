import { describe, expect, it } from "vitest";
import { isOrderable } from "./availability";

describe("isOrderable", () => {
  it("autorise la commande pour les statuts disponibles ou à vérifier", () => {
    expect(isOrderable("AVAILABLE")).toBe(true);
    expect(isOrderable("TO_CONFIRM")).toBe(true);
    expect(isOrderable("ON_ORDER")).toBe(true);
  });

  it("bloque la commande pour rupture de stock ou désactivé", () => {
    expect(isOrderable("OUT_OF_STOCK")).toBe(false);
    expect(isOrderable("DISABLED")).toBe(false);
  });
});
