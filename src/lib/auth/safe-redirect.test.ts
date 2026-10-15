import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it.each(["/", "/compte", "/admin", "/commande/confirmation/RB-1?x=1", "/catalogue?tri=price_asc"])(
    "accepte le chemin interne %s",
    (path) => {
      expect(safeRedirectPath(path)).toBe(path);
    },
  );

  it.each([
    "https://faux-site.com",
    "http://faux-site.com/compte",
    "//faux-site.com",
    "/\\faux-site.com",
    "\\\\faux-site.com",
    "javascript:alert(1)",
    "faux-site.com",
    "/ok\r\nLocation: https://faux-site.com",
    "/ok\\@faux-site.com",
    "",
  ])("refuse %j et retombe sur l'accueil", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });

  it("refuse ce qui n'est pas une chaîne", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath(42)).toBe("/");
  });
});
