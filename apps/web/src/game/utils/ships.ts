/**
 * Ship Constants - Centralized ship configuration for the client.
 *
 * This file provides ship metadata for UI components and game logic.
 * Server-side constants are maintained separately in convex/lib/constants.ts.
 */

import type { ShipType } from "./placementResolver";

/** Ship metadata for display and game logic */
export interface ShipInfo {
  type: ShipType;
  abbrev: string; // Two-letter abbreviation for compact display
  name: string; // Full display name
  length: number; // Number of cells the ship occupies
}

/**
 * All ships in order from largest to smallest.
 * This ordering is used for consistent display in UI components.
 */
export const SHIPS: readonly ShipInfo[] = [
  { type: "carrier", abbrev: "Ca", name: "Carrier", length: 5 },
  { type: "battleship", abbrev: "Ba", name: "Battleship", length: 4 },
  { type: "cruiser", abbrev: "Cr", name: "Cruiser", length: 3 },
  { type: "submarine", abbrev: "Su", name: "Submarine", length: 3 },
  { type: "destroyer", abbrev: "De", name: "Destroyer", length: 2 },
] as const;

/**
 * Ship names by type for display purposes.
 * O(1) lookup by ship type.
 */
export const SHIP_NAMES: Record<string, string> = {
  carrier: "Carrier",
  battleship: "Battleship",
  cruiser: "Cruiser",
  submarine: "Submarine",
  destroyer: "Destroyer",
};

/**
 * Ship lengths by type for game calculations.
 * O(1) lookup by ship type.
 */
export const SHIP_LENGTHS: Record<string, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

/**
 * Required ship types for a valid fleet placement.
 */
export const REQUIRED_SHIPS: readonly ShipType[] = [
  "carrier",
  "battleship",
  "cruiser",
  "submarine",
  "destroyer",
];

/**
 * Total number of cells occupied by all ships combined.
 * Useful for win condition calculations.
 */
export const TOTAL_SHIP_CELLS = SHIPS.reduce(
  (total, ship) => total + ship.length,
  0
); // 5 + 4 + 3 + 3 + 2 = 17 cells
