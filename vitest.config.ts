import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Séparés des tests unitaires (rapides, sans DB) : les tests
    // d'intégration tapent la vraie base Neon et doivent tourner à part
    // (voir package.json : test / test:integration).
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
