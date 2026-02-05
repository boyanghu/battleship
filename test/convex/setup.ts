/**
 * Vitest setup file for Convex tests.
 * 
 * This file runs before all tests and sets up the testing environment.
 */

import { vi } from "vitest";

// Mock Date.now() for deterministic testing
// Tests can override this as needed with vi.setSystemTime()
const FIXED_TIME = 1700000000000; // Nov 14, 2023 22:13:20 UTC

vi.useFakeTimers();
vi.setSystemTime(FIXED_TIME);

// Export the fixed time for use in tests
export const TEST_FIXED_TIME = FIXED_TIME;
