import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    globals: true,
    include: ["test/convex/**/*.test.ts"],
    // Exclude node_modules and other unrelated files
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Setup file for common test utilities
    setupFiles: ["./test/convex/setup.ts"],
    // Run tests sequentially
    sequence: {
      concurrent: false,
    },
    testTimeout: 10000,
  },
});
