import { describe, expect, it } from "vitest";
import { normalizePhone, phoneCandidates } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["656929480", "+237656929480"],
    ["6 56 92 94 80", "+237656929480"],
    ["+237 656 92 94 80", "+237656929480"],
    ["237656929480", "+237656929480"],
    ["00237 656929480", "+237656929480"],
    ["+237656929480", "+237656929480"],
    ["222 23 45 67", "+237222234567"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("laisse tel quel un numéro d'un autre format", () => {
    expect(normalizePhone("  +33 6 12 34 56 78 ")).toBe("+33 6 12 34 56 78");
  });
});

describe("phoneCandidates", () => {
  it("retrouve toutes les écritures d'un même numéro", () => {
    const candidates = phoneCandidates("6 56 92 94 80");
    expect(candidates).toEqual(
      expect.arrayContaining(["+237656929480", "237656929480", "656929480"]),
    );
  });

  it("donne le même ensemble quel que soit le format saisi", () => {
    const a = new Set(phoneCandidates("+237 656 92 94 80"));
    const b = new Set(phoneCandidates("656929480"));
    for (const canonical of ["+237656929480", "237656929480", "656929480"]) {
      expect(a.has(canonical)).toBe(true);
      expect(b.has(canonical)).toBe(true);
    }
  });
});
