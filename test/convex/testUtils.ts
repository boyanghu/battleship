/**
 * Test utilities for Convex tests.
 * 
 * Provides factory functions for creating test fixtures.
 */

import type { Ship, Board, Shot, Coord, ShipType, Orientation } from "../../convex/games/helpers";

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a test ship with default values.
 */
export function createTestShip(overrides: Partial<Ship> = {}): Ship {
  return {
    shipType: "destroyer",
    origin: { x: 0, y: 0 },
    orientation: "horizontal",
    length: 2,
    ...overrides,
  };
}

/**
 * Create a test shot with default values.
 */
export function createTestShot(overrides: Partial<Shot> = {}): Shot {
  return {
    coord: { x: 0, y: 0 },
    result: "miss",
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create a test board with default values.
 */
export function createTestBoard(overrides: Partial<Board> = {}): Board {
  return {
    ships: [],
    shotsReceived: [],
    ...overrides,
  };
}

/**
 * Create a standard fleet (all 5 ships) in non-overlapping positions.
 */
export function createStandardFleet(): Ship[] {
  return [
    { shipType: "carrier", origin: { x: 0, y: 0 }, orientation: "horizontal", length: 5 },
    { shipType: "battleship", origin: { x: 0, y: 1 }, orientation: "horizontal", length: 4 },
    { shipType: "cruiser", origin: { x: 0, y: 2 }, orientation: "horizontal", length: 3 },
    { shipType: "submarine", origin: { x: 0, y: 3 }, orientation: "horizontal", length: 3 },
    { shipType: "destroyer", origin: { x: 0, y: 4 }, orientation: "horizontal", length: 2 },
  ];
}

/**
 * Create a coordinate.
 */
export function coord(x: number, y: number): Coord {
  return { x, y };
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Assert that two coordinates are equal.
 */
export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Get all cells occupied by a ship (for test assertions).
 */
export function getShipCells(ship: Ship): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < ship.length; i++) {
    if (ship.orientation === "horizontal") {
      cells.push({ x: ship.origin.x + i, y: ship.origin.y });
    } else {
      cells.push({ x: ship.origin.x, y: ship.origin.y + i });
    }
  }
  return cells;
}
