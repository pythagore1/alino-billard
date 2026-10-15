import { describe, expect, it } from "vitest";
import { mapNotchPayStatus } from "./notchpay-status";

// Basé sur des réponses réelles observées en sandbox NotchPay (voir
// commentaires dans notchpay-status.ts) : pending -> processing -> complete.
describe("mapNotchPayStatus", () => {
  it("mappe 'complete' vers SUCCESS", () => {
    expect(mapNotchPayStatus({ transaction: { status: "complete" } })).toBe("SUCCESS");
  });

  it("mappe 'failed' vers FAILED", () => {
    expect(mapNotchPayStatus({ transaction: { status: "failed" } })).toBe("FAILED");
  });

  it("mappe 'canceled' et 'expired' vers CANCELLED", () => {
    expect(mapNotchPayStatus({ transaction: { status: "canceled" } })).toBe("CANCELLED");
    expect(mapNotchPayStatus({ transaction: { status: "expired" } })).toBe("CANCELLED");
  });

  it("mappe 'pending' et 'processing' vers PENDING", () => {
    expect(mapNotchPayStatus({ transaction: { status: "pending" } })).toBe("PENDING");
    expect(mapNotchPayStatus({ transaction: { status: "processing" } })).toBe("PENDING");
  });

  it("ne renvoie jamais SUCCESS pour une valeur inconnue ou absente (pas de faux positif)", () => {
    expect(mapNotchPayStatus({ transaction: { status: "quelque_chose_de_nouveau" } })).toBe("PENDING");
    expect(mapNotchPayStatus({})).toBe("PENDING");
    expect(mapNotchPayStatus(null)).toBe("PENDING");
    expect(mapNotchPayStatus(undefined)).toBe("PENDING");
  });
});
