import { describe, expect, it } from "vitest";
import { mapMonetbilStatus } from "./monetbil-status";

describe("mapMonetbilStatus", () => {
  it("mode réel : 1 payé, 0 échec, -1 annulé", () => {
    expect(mapMonetbilStatus(1, false)).toBe("SUCCESS");
    expect(mapMonetbilStatus(0, false)).toBe("FAILED");
    expect(mapMonetbilStatus(-1, false)).toBe("CANCELLED");
  });

  it("accepte aussi des valeurs en chaîne (formulaire)", () => {
    expect(mapMonetbilStatus("1", false)).toBe("SUCCESS");
    expect(mapMonetbilStatus("-1", false)).toBe("CANCELLED");
  });

  it("un « payé » en mode test n'est JAMAIS un vrai paiement sans MONETBIL_TEST_MODE", () => {
    expect(mapMonetbilStatus(7, false)).toBe("PENDING");
    expect(mapMonetbilStatus(7, true)).toBe("SUCCESS");
  });

  it("échecs et annulations en mode test", () => {
    expect(mapMonetbilStatus(8, false)).toBe("FAILED");
    expect(mapMonetbilStatus(9, false)).toBe("CANCELLED");
  });

  it("valeur inattendue -> en attente, jamais payé", () => {
    expect(mapMonetbilStatus(42, true)).toBe("PENDING");
    expect(mapMonetbilStatus(undefined, true)).toBe("PENDING");
    expect(mapMonetbilStatus("n'importe quoi", true)).toBe("PENDING");
    expect(mapMonetbilStatus(null, true)).toBe("PENDING");
    expect(mapMonetbilStatus("", true)).toBe("PENDING");
    expect(mapMonetbilStatus("  ", true)).toBe("PENDING");
    expect(mapMonetbilStatus(false, true)).toBe("PENDING");
  });
});
