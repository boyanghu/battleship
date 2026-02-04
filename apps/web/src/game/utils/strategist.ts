/**
 * Strategist AI - Suggests optimal firing positions based on board state.
 *
 * Algorithm:
 * 1. Priority: Adjacent to hits (not sunk) - likely to find more of the same ship
 * 2. Fallback: Checkerboard pattern on unfired cells - statistically optimal coverage
 *
 * Time Complexity:
 * - getStrategistRecommendation: O(n) where n = number of cells (100 for 10x10 board)
 */

import { type Coordinate, type EnemyCellState, BOARD_SIZE } from "../types";
import { stringToCoord, xyToString, isInBounds } from "./coordinates";

// Adjacent directions (up, down, left, right)
const DIRECTIONS = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 },  // right
];

/**
 * Get unfired adjacent cells to a coordinate
 */
function getUnfiredAdjacent(
  coord: Coordinate,
  enemyCells: Map<Coordinate, EnemyCellState>
): Coordinate[] {
  const { x, y } = stringToCoord(coord);
  const adjacent: Coordinate[] = [];

  for (const { dx, dy } of DIRECTIONS) {
    const nx = x + dx;
    const ny = y + dy;

    if (isInBounds(nx, ny)) {
      const neighborCoord = xyToString(nx, ny);
      const state = enemyCells.get(neighborCoord);

      // Only add if unfired (no state or neutral)
      if (!state || state === "neutral") {
        adjacent.push(neighborCoord);
      }
    }
  }

  return adjacent;
}

/**
 * Find all "hit" cells that are NOT part of a sunk ship.
 * These are active targets we should finish sinking.
 */
function findActiveHits(
  enemyCells: Map<Coordinate, EnemyCellState>
): Coordinate[] {
  const hits: Coordinate[] = [];

  enemyCells.forEach((state, coord) => {
    // Only "hit" cells (not "sunk") indicate unfinished ships
    if (state === "hit") {
      hits.push(coord);
    }
  });

  return hits;
}

/**
 * Get all unfired cells on the board.
 * O(n) where n = BOARD_SIZE^2 (100 cells)
 */
function getAllUnfiredCells(
  enemyCells: Map<Coordinate, EnemyCellState>
): Coordinate[] {
  const unfired: Coordinate[] = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const coord = xyToString(x, y);
      const state = enemyCells.get(coord);

      if (!state || state === "neutral") {
        unfired.push(coord);
      }
    }
  }

  return unfired;
}

/**
 * Filter cells to checkerboard pattern for optimal coverage.
 * Checkerboard means (x + y) % 2 === 0 or 1.
 * O(n) where n = cells.length
 */
function filterCheckerboard(
  cells: Coordinate[],
  parity: 0 | 1
): Coordinate[] {
  return cells.filter((coord) => {
    const { x, y } = stringToCoord(coord);
    return (x + y) % 2 === parity;
  });
}

/**
 * Pick a random element from an array.
 */
function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Strategist AI: Suggests the optimal next target.
 *
 * Strategy:
 * 1. If there are active hits (ships partially damaged), target adjacent cells
 * 2. Otherwise, use checkerboard pattern for efficient coverage
 * 3. Fall back to any unfired cell if checkerboard is exhausted
 *
 * @param enemyCells Map of coordinates to their current state
 * @returns Recommended coordinate to fire at, or null if no valid targets
 */
export function getStrategistRecommendation(
  enemyCells: Map<Coordinate, EnemyCellState>
): Coordinate | null {
  // Priority 1: Find cells adjacent to active hits
  const activeHits = findActiveHits(enemyCells);

  if (activeHits.length > 0) {
    // Collect all unique unfired adjacent cells
    const adjacentCandidates = new Set<Coordinate>();

    for (const hit of activeHits) {
      const adjacent = getUnfiredAdjacent(hit, enemyCells);
      adjacent.forEach((coord) => adjacentCandidates.add(coord));
    }

    if (adjacentCandidates.size > 0) {
      // Pick randomly from adjacent candidates
      return pickRandom(Array.from(adjacentCandidates));
    }
  }

  // Priority 2: Checkerboard pattern on unfired cells
  const allUnfired = getAllUnfiredCells(enemyCells);

  if (allUnfired.length === 0) {
    return null; // No valid targets
  }

  // Try parity 0 first (arbitrary choice), then parity 1
  const checkerboard0 = filterCheckerboard(allUnfired, 0);
  if (checkerboard0.length > 0) {
    return pickRandom(checkerboard0);
  }

  const checkerboard1 = filterCheckerboard(allUnfired, 1);
  if (checkerboard1.length > 0) {
    return pickRandom(checkerboard1);
  }

  // Fallback: any unfired cell (shouldn't reach here normally)
  return pickRandom(allUnfired);
}

/**
 * Format the strategist instruction text.
 */
export function formatStrategistInstruction(coord: Coordinate): string {
  return `Fire on ${coord}`;
}
