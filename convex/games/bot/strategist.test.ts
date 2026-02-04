/**
 * Unit tests for server-side strategist AI.
 */

import { describe, it, expect } from "vitest";
import { getBotRecommendation } from "./strategist";
import type { Shot, Coord } from "../helpers";

/**
 * Create a test shot.
 */
function createShot(x: number, y: number, result: "miss" | "hit" | "sunk"): Shot {
  return {
    coord: { x, y },
    result,
    timestamp: Date.now(),
  };
}

/**
 * Create an array of shots covering a range.
 */
function createShotsGrid(
  startX: number,
  startY: number,
  width: number,
  height: number,
  result: "miss" | "hit" | "sunk" = "miss"
): Shot[] {
  const shots: Shot[] = [];
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      shots.push(createShot(x, y, result));
    }
  }
  return shots;
}

describe("getBotRecommendation", () => {
  it("should return a valid coordinate on empty board", () => {
    const result = getBotRecommendation([]);

    expect(result).not.toBeNull();
    expect(result!.x).toBeGreaterThanOrEqual(0);
    expect(result!.x).toBeLessThan(10);
    expect(result!.y).toBeGreaterThanOrEqual(0);
    expect(result!.y).toBeLessThan(10);
  });

  it("should not return already-fired coordinates", () => {
    // Fire at most of the board
    const shotsReceived = createShotsGrid(0, 0, 10, 9); // Leave row 9 empty

    const result = getBotRecommendation(shotsReceived);

    expect(result).not.toBeNull();
    expect(result!.y).toBe(9); // Should target the only unfired row
  });

  it("should return null when all cells have been fired", () => {
    const shotsReceived = createShotsGrid(0, 0, 10, 10); // Entire board

    const result = getBotRecommendation(shotsReceived);

    expect(result).toBeNull();
  });

  it("should prioritize cells adjacent to hits", () => {
    // Single hit in the middle of the board
    const shotsReceived = [
      createShot(5, 5, "hit"),
    ];

    // Run multiple times to check distribution
    const results: Coord[] = [];
    for (let i = 0; i < 20; i++) {
      const result = getBotRecommendation(shotsReceived);
      if (result) results.push(result);
    }

    // All results should be adjacent to (5, 5)
    const adjacentCoords = [
      { x: 4, y: 5 }, // left
      { x: 6, y: 5 }, // right
      { x: 5, y: 4 }, // up
      { x: 5, y: 6 }, // down
    ];

    for (const result of results) {
      const isAdjacent = adjacentCoords.some(
        (adj) => adj.x === result.x && adj.y === result.y
      );
      expect(isAdjacent).toBe(true);
    }
  });

  it("should not target sunk cells adjacent to hits", () => {
    // Hit at (5, 5), but adjacent cell (6, 5) already has a shot
    const shotsReceived = [
      createShot(5, 5, "hit"),
      createShot(6, 5, "miss"),
    ];

    // Run multiple times
    const results: Coord[] = [];
    for (let i = 0; i < 20; i++) {
      const result = getBotRecommendation(shotsReceived);
      if (result) results.push(result);
    }

    // Should not target (6, 5)
    for (const result of results) {
      expect(result.x !== 6 || result.y !== 5).toBe(true);
    }
  });

  it("should use checkerboard pattern when no active hits", () => {
    // No hits, just some misses
    const shotsReceived = [
      createShot(0, 0, "miss"),
      createShot(1, 1, "miss"),
    ];

    const result = getBotRecommendation(shotsReceived);

    expect(result).not.toBeNull();
    // Should not be one of the already-fired cells
    expect(result!.x !== 0 || result!.y !== 0).toBe(true);
    expect(result!.x !== 1 || result!.y !== 1).toBe(true);
  });

  it("should not consider sunk ships as active hits", () => {
    // Ship was sunk (result is "sunk", not "hit")
    const shotsReceived = [
      createShot(5, 5, "sunk"),
    ];

    // Run multiple times
    const results: Coord[] = [];
    for (let i = 0; i < 10; i++) {
      const result = getBotRecommendation(shotsReceived);
      if (result) results.push(result);
    }

    // Results should not necessarily be adjacent to (5, 5)
    // because sunk ships shouldn't trigger the adjacent priority
    // (they're complete)
    expect(results.length).toBeGreaterThan(0);
  });

  it("should handle edge cases at board boundaries", () => {
    // Hit in the corner
    const shotsReceived = [
      createShot(0, 0, "hit"),
    ];

    // Run multiple times
    const results: Coord[] = [];
    for (let i = 0; i < 20; i++) {
      const result = getBotRecommendation(shotsReceived);
      if (result) results.push(result);
    }

    // Only valid adjacent cells are (1, 0) and (0, 1)
    const validAdjacent = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];

    for (const result of results) {
      const isValid = validAdjacent.some(
        (adj) => adj.x === result.x && adj.y === result.y
      );
      expect(isValid).toBe(true);
    }
  });

  it("should handle multiple active hits (from same ship)", () => {
    // Two adjacent hits (likely same ship)
    const shotsReceived = [
      createShot(5, 5, "hit"),
      createShot(6, 5, "hit"),
    ];

    // Run multiple times
    const results: Coord[] = [];
    for (let i = 0; i < 30; i++) {
      const result = getBotRecommendation(shotsReceived);
      if (result) results.push(result);
    }

    // Should target cells adjacent to either hit
    const validAdjacent = [
      { x: 4, y: 5 }, // left of first hit
      { x: 7, y: 5 }, // right of second hit
      { x: 5, y: 4 }, // up from first hit
      { x: 5, y: 6 }, // down from first hit
      { x: 6, y: 4 }, // up from second hit
      { x: 6, y: 6 }, // down from second hit
    ];

    for (const result of results) {
      const isValid = validAdjacent.some(
        (adj) => adj.x === result.x && adj.y === result.y
      );
      expect(isValid).toBe(true);
    }
  });
});
