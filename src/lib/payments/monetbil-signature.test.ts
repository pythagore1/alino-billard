import { describe, expect, it } from "vitest";
import { isValidMonetbilSign, monetbilSign, newMonetbilPaymentRef } from "./monetbil-signature";

describe("monetbilSign", () => {
  it("trie les champs par nom, concatène les valeurs et préfixe le secret (MD5)", () => {
    // Valeur calculée indépendamment (Python hashlib.md5(b"s3cret12")) : champs a="1", b="2" triés par nom.
    expect(monetbilSign("s3cret", { b: "2", a: "1" })).toBe("bfdf09d55ae6667eeb5ac6d024b69de4");
  });

  it("ne dépend pas de l'ordre d'arrivée des champs", () => {
    const a = monetbilSign("k", { transaction_id: "T1", amount: "5000", payment_ref: "mbabc" });
    const b = monetbilSign("k", { payment_ref: "mbabc", transaction_id: "T1", amount: "5000" });
    expect(a).toBe(b);
  });
});

describe("isValidMonetbilSign", () => {
  const SECRET = "secret-de-service";
  const FIELDS = { transaction_id: "T123", payment_ref: "mbabc", amount: "5000", status: "1", item_ref: "ORD1" };

  it("accepte une signature correcte, quelle que soit la casse", () => {
    const sign = monetbilSign(SECRET, FIELDS);
    expect(isValidMonetbilSign({ ...FIELDS, sign }, SECRET)).toBe(true);
    expect(isValidMonetbilSign({ ...FIELDS, sign: sign.toUpperCase() }, SECRET)).toBe(true);
  });

  it("refuse si un champ est modifié, si le secret diffère, ou sans signature", () => {
    const sign = monetbilSign(SECRET, FIELDS);
    expect(isValidMonetbilSign({ ...FIELDS, amount: "5", sign }, SECRET)).toBe(false);
    expect(isValidMonetbilSign({ ...FIELDS, sign }, "autre-secret")).toBe(false);
    expect(isValidMonetbilSign(FIELDS, SECRET)).toBe(false);
    expect(isValidMonetbilSign({ ...FIELDS, sign: "" }, SECRET)).toBe(false);
  });
});

describe("newMonetbilPaymentRef", () => {
  it("est alphanumérique, court et unique à chaque appel", () => {
    const a = newMonetbilPaymentRef("ORD-1");
    const b = newMonetbilPaymentRef("ORD-1");
    expect(a).toMatch(/^mb[0-9a-f]{20}$/);
    expect(a).not.toBe(b);
  });
});
