import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    globals: true,
    include: ["convex/**/*.test.ts"],
    // Exclude node_modules and other unrelated files
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Setup file for common test utilities
    setupFiles: ["./convex/test/setup.ts"],
    // Run tests sequentially
    sequence: {
      concurrent: false,
    },
    testTimeout: 10000,
  },
});
