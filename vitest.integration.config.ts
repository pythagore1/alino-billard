import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests d'intégration : tapent la vraie base (DATABASE_URL), créent et
// nettoient leurs propres données à chaque exécution. Séparés des tests
// unitaires (vitest.config.ts) pour ne jamais les faire tourner par erreur
// dans un contexte qui n'a pas de base configurée (ex: CI sans DB).
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["**/node_modules/**"],
    setupFiles: ["./vitest.integration.setup.ts"],
    // Les opérations réseau (Neon) + sandbox NotchPay peuvent être lentes.
    testTimeout: 30000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
