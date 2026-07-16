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
      // Cover the security-critical surface too — lib, server actions and the
      // middleware — not just the pure helpers, so the number reflects reality.
      include: ["src/lib/**/*.ts", "src/actions/**/*.ts", "src/middleware.ts"],
      // Excluded: the Prisma client singleton (trivial) and the read/query layer
      // (pure DB-query shapes with no branching logic, exercised by runtime
      // checks rather than unit tests).
      exclude: ["src/lib/prisma.ts", "src/lib/queries.ts"],
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
      // `server-only` has no resolvable module on disk; stub it so server
      // modules (auth.ts, rate-limit.ts) can be imported directly in tests.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
});
