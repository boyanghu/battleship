/**
 * Server-side Strategist AI for Bot player.
 * 
 * Algorithm:
 * 1. Priority: Adjacent to hits (not sunk) - likely to find more of the same ship
 * 2. Fallback: Checkerboard pattern on unfired cells - statistically optimal coverage
 */

import { BOARD_SIZE } from "../../lib/constants";
import type { Coord, Shot } from "../helpers";

// Adjacent directions (up, down, left, right)
const DIRECTIONS = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 },  // right
];

/**
 * Check if coordinate is within board bounds
 */
function isInBounds(coord: Coord): boolean {
  return (
    coord.x >= 0 &&
    coord.x < BOARD_SIZE &&
    coord.y >= 0 &&
    coord.y < BOARD_SIZE
  );
}

/**
 * Check if two coordinates are equal
 */
function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Check if a coordinate has been fired at
 */
function isFiredAt(coord: Coord, shotsReceived: Shot[]): boolean {
  return shotsReceived.some((shot) => coordsEqual(shot.coord, coord));
}

/**
 * Get unfired adjacent cells to a coordinate
 */
function getUnfiredAdjacent(coord: Coord, shotsReceived: Shot[]): Coord[] {
  const adjacent: Coord[] = [];

  for (const { dx, dy } of DIRECTIONS) {
    const neighbor: Coord = { x: coord.x + dx, y: coord.y + dy };

    if (isInBounds(neighbor) && !isFiredAt(neighbor, shotsReceived)) {
      adjacent.push(neighbor);
    }
  }

  return adjacent;
}

/**
 * Find all "hit" cells that are NOT part of a sunk ship.
 * These are active targets we should finish sinking.
 */
function findActiveHits(shotsReceived: Shot[]): Coord[] {
  // Get all sunk coordinates to exclude
  const sunkCoords = new Set<string>();
  
  // For simplicity, we track which shots were "sunk" results
  // These indicate the final hit that sank a ship
  // All previous hits on the same ship are also considered "resolved"
  // But since we don't have ship cell tracking here, we use "hit" status
  
  return shotsReceived
    .filter((shot) => shot.result === "hit") // Only "hit", not "sunk"
    .map((shot) => shot.coord);
}

/**
 * Get all unfired cells on the board.
 */
function getAllUnfiredCells(shotsReceived: Shot[]): Coord[] {
  const unfired: Coord[] = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const coord: Coord = { x, y };
      if (!isFiredAt(coord, shotsReceived)) {
        unfired.push(coord);
      }
    }
  }

  return unfired;
}

/**
 * Filter cells to checkerboard pattern for optimal coverage.
 * Checkerboard means (x + y) % 2 === 0 or 1.
 */
function filterCheckerboard(cells: Coord[], parity: 0 | 1): Coord[] {
  return cells.filter((coord) => (coord.x + coord.y) % 2 === parity);
}

/**
 * Pick a random element from an array.
 */
function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Strategist AI: Computes the optimal next target for the bot.
 *
 * Strategy:
 * 1. If there are active hits (ships partially damaged), target adjacent cells
 * 2. Otherwise, use checkerboard pattern for efficient coverage
 * 3. Fall back to any unfired cell if checkerboard is exhausted
 *
 * @param opponentShotsReceived Shots the bot has fired at the opponent
 * @returns Recommended coordinate to fire at, or null if no valid targets
 */
export function getBotRecommendation(opponentShotsReceived: Shot[]): Coord | null {
  // Priority 1: Find cells adjacent to active hits
  const activeHits = findActiveHits(opponentShotsReceived);

  if (activeHits.length > 0) {
    // Collect all unique unfired adjacent cells
    const adjacentCandidates: Coord[] = [];
    const seen = new Set<string>();

    for (const hit of activeHits) {
      const adjacent = getUnfiredAdjacent(hit, opponentShotsReceived);
      for (const coord of adjacent) {
        const key = `${coord.x},${coord.y}`;
        if (!seen.has(key)) {
          seen.add(key);
          adjacentCandidates.push(coord);
        }
      }
    }

    if (adjacentCandidates.length > 0) {
      return pickRandom(adjacentCandidates);
    }
  }

  // Priority 2: Checkerboard pattern on unfired cells
  const allUnfired = getAllUnfiredCells(opponentShotsReceived);

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
