import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  it("accepte une inscription avec email", () => {
    const result = registerSchema.safeParse({
      name: "Jean Client",
      email: "jean@example.com",
      password: "motdepasse123",
    });
    expect(result.success).toBe(true);
  });

  it("accepte une inscription avec juste un téléphone (sans email)", () => {
    const result = registerSchema.safeParse({
      name: "Jean Client",
      phone: "+237600000000",
      password: "motdepasse123",
    });
    expect(result.success).toBe(true);
  });

  it("rejette si ni email ni téléphone ne sont fournis", () => {
    const result = registerSchema.safeParse({
      name: "Jean Client",
      password: "motdepasse123",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe trop court (moins de 8 caractères)", () => {
    const result = registerSchema.safeParse({
      name: "Jean Client",
      email: "jean@example.com",
      password: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un email invalide", () => {
    const result = registerSchema.safeParse({
      name: "Jean Client",
      email: "pas-un-email",
      password: "motdepasse123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepte un identifiant email ou téléphone", () => {
    expect(
      loginSchema.safeParse({ identifier: "jean@example.com", password: "motdepasse" }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ identifier: "+237600000000", password: "motdepasse" }).success,
    ).toBe(true);
  });

  it("rejette un mot de passe vide", () => {
    expect(
      loginSchema.safeParse({ identifier: "jean@example.com", password: "" }).success,
    ).toBe(false);
  });
});
