import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Default environment is node; component test files opt into jsdom via a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: "node",
    globals: false,
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    env: {
      // Deterministic secret so session sign/verify tests are reproducible.
      AUTH_SECRET: "test-secret-do-not-use-in-production-1234567890",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      // Excluded: DB/runtime-bound modules that need next/headers or Prisma and
      // are covered by integration/runtime checks rather than unit tests.
      exclude: [
        "src/lib/prisma.ts",
        "src/lib/auth.ts",
        "src/lib/queries.ts",
        "src/lib/rate-limit.ts",
      ],
    },
  },
  esbuild: {
    // Use the automatic JSX runtime so component test files don't need to
    // import React explicitly.
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
