import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidNotchPaySignature } from "./notchpay-signature";

const HASH = "hsk_test_examplehash";
const BODY = JSON.stringify({ type: "payment.complete", data: { merchant_reference: "RB-1" } });

function sign(body: string, hash: string) {
  return crypto.createHmac("sha256", hash).update(body).digest("hex");
}

describe("isValidNotchPaySignature", () => {
  it("accepte une signature valide", () => {
    expect(isValidNotchPaySignature(BODY, sign(BODY, HASH), HASH)).toBe(true);
  });

  it("rejette une signature calculée avec le mauvais secret", () => {
    expect(isValidNotchPaySignature(BODY, sign(BODY, "mauvais_secret"), HASH)).toBe(false);
  });

  it("rejette un corps modifié après signature", () => {
    const validSig = sign(BODY, HASH);
    expect(isValidNotchPaySignature(BODY + "x", validSig, HASH)).toBe(false);
  });

  it("rejette une signature manquante", () => {
    expect(isValidNotchPaySignature(BODY, null, HASH)).toBe(false);
  });

  it("rejette si le hash secret est vide", () => {
    expect(isValidNotchPaySignature(BODY, sign(BODY, HASH), "")).toBe(false);
  });
});
