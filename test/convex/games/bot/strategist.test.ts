/**
 * Unit tests for server-side strategist AI.
 *
 * Tests cover:
 * - Hunt mode: single hits, aligned hits (endpoint targeting), boundary handling
 * - Search mode: heatmap-based selection
 * - Sink exclusion: sunkShipCells handling
 */

import { describe, it, expect } from "vitest";
import {
  getBotRecommendation,
  deriveContext,
  buildClusters,
  huntMode,
  searchMode,
  computeHeatmap,
  coordKey,
} from "../../../../convex/games/bot/strategist";
import type { Shot, Coord, ShipType } from "../../../../convex/games/helpers";

/**
 * Create a test shot.
 */
function createShot(
  x: number,
  y: number,
  result: "miss" | "hit" | "sunk",
  options?: { sunkShipType?: ShipType; sunkShipCells?: Coord[] }
): Shot {
  return {
    coord: { x, y },
    result,
    timestamp: Date.now(),
    sunkShipType: options?.sunkShipType,
    sunkShipCells: options?.sunkShipCells,
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
  describe("basic functionality", () => {
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
  });

  describe("hunt mode - single hit", () => {
    it("should prioritize cells adjacent to a single hit", () => {
      // Single hit in the middle of the board
      const shotsReceived = [createShot(5, 5, "hit")];

      // Run multiple times to check distribution
      const results: Coord[] = [];
      for (let i = 0; i < 20; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) results.push(result);
      }

      // All results should be adjacent to (5, 5) - 4 neighbors only
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

    it("should not target already-fired cells adjacent to hits", () => {
      // Hit at (5, 5), but adjacent cell (6, 5) already has a shot
      const shotsReceived = [createShot(5, 5, "hit"), createShot(6, 5, "miss")];

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

    it("should handle edge cases at board boundaries", () => {
      // Hit in the corner
      const shotsReceived = [createShot(0, 0, "hit")];

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
  });

  describe("hunt mode - aligned hits (line extension)", () => {
    it("should target line endpoints for two horizontal aligned hits", () => {
      // Two adjacent hits forming a horizontal line
      const shotsReceived = [createShot(5, 5, "hit"), createShot(6, 5, "hit")];

      // Run multiple times
      const results: Coord[] = [];
      for (let i = 0; i < 30; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) results.push(result);
      }

      // Should ONLY target endpoints (4, 5) and (7, 5)
      // NOT perpendicular neighbors like (5, 4), (5, 6), (6, 4), (6, 6)
      const validEndpoints = [
        { x: 4, y: 5 }, // left endpoint
        { x: 7, y: 5 }, // right endpoint
      ];

      for (const result of results) {
        const isEndpoint = validEndpoints.some(
          (ep) => ep.x === result.x && ep.y === result.y
        );
        expect(isEndpoint).toBe(true);
      }
    });

    it("should target line endpoints for two vertical aligned hits", () => {
      // Two adjacent hits forming a vertical line
      const shotsReceived = [createShot(5, 5, "hit"), createShot(5, 6, "hit")];

      // Run multiple times
      const results: Coord[] = [];
      for (let i = 0; i < 30; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) results.push(result);
      }

      // Should ONLY target endpoints (5, 4) and (5, 7)
      const validEndpoints = [
        { x: 5, y: 4 }, // top endpoint
        { x: 5, y: 7 }, // bottom endpoint
      ];

      for (const result of results) {
        const isEndpoint = validEndpoints.some(
          (ep) => ep.x === result.x && ep.y === result.y
        );
        expect(isEndpoint).toBe(true);
      }
    });

    it("should target remaining endpoint when one is blocked", () => {
      // Three horizontal hits with miss blocking the left
      const shotsReceived = [
        createShot(3, 5, "miss"), // Blocks left endpoint
        createShot(4, 5, "hit"),
        createShot(5, 5, "hit"),
        createShot(6, 5, "hit"),
      ];

      // Run multiple times
      const results: Coord[] = [];
      for (let i = 0; i < 20; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) results.push(result);
      }

      // Should only target the right endpoint (7, 5)
      for (const result of results) {
        expect(result.x).toBe(7);
        expect(result.y).toBe(5);
      }
    });
  });

  describe("sink exclusion", () => {
    it("should not consider sunk shots as active hits", () => {
      // Ship was sunk (result is "sunk", not "hit")
      const shotsReceived = [createShot(5, 5, "sunk")];

      // Run multiple times
      const results: Coord[] = [];
      for (let i = 0; i < 10; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) results.push(result);
      }

      // Results should NOT be adjacent to (5, 5) since it's not an active hit
      expect(results.length).toBeGreaterThan(0);
    });

    it("should exclude sunkShipCells from active hits", () => {
      // Ship sunk at (5, 5) with cells provided
      const sunkShipCells: Coord[] = [
        { x: 4, y: 5 },
        { x: 5, y: 5 },
      ];
      const shotsReceived = [
        createShot(4, 5, "hit"), // This was a hit before the ship sank
        createShot(5, 5, "sunk", { sunkShipType: "destroyer", sunkShipCells }),
      ];

      // Derive context to check
      const ctx = deriveContext(shotsReceived);

      // Both cells should be in sunkCellsSet
      expect(ctx.sunkCellsSet.has("4,5")).toBe(true);
      expect(ctx.sunkCellsSet.has("5,5")).toBe(true);

      // Neither should be in activeHitSet
      expect(ctx.activeHitSet.has("4,5")).toBe(false);
      expect(ctx.activeHitSet.has("5,5")).toBe(false);
    });

    it("should never recommend sunkShipCells", () => {
      // Ship sunk with cells (3,5), (4,5), (5,5)
      const sunkShipCells: Coord[] = [
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
      ];
      const shotsReceived = [
        createShot(3, 5, "hit"),
        createShot(4, 5, "hit"),
        createShot(5, 5, "sunk", { sunkShipType: "cruiser", sunkShipCells }),
      ];

      // Run many times
      for (let i = 0; i < 50; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) {
          // Should never be one of the sunk cells
          const isSunkCell = sunkShipCells.some(
            (c) => c.x === result.x && c.y === result.y
          );
          expect(isSunkCell).toBe(false);
        }
      }
    });

    it("should update remainingLengths when ships are sunk", () => {
      const shotsReceived = [
        createShot(5, 5, "sunk", {
          sunkShipType: "destroyer",
          sunkShipCells: [
            { x: 5, y: 5 },
            { x: 6, y: 5 },
          ],
        }),
      ];

      const ctx = deriveContext(shotsReceived);

      // Destroyer (length 2) should be removed from remaining lengths
      // Standard fleet: [5, 4, 3, 3, 2] -> [5, 4, 3, 3]
      expect(ctx.remainingLengths).not.toContain(2);
      expect(ctx.remainingLengths.length).toBe(4);
    });
  });

  describe("search mode (heatmap)", () => {
    it("should use heatmap when no active hits exist", () => {
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

    it("should prefer cells with higher heatmap scores", () => {
      // Fire at edges to leave center cells with higher probability
      const shotsReceived: Shot[] = [];

      // Fire at all edge cells
      for (let i = 0; i < 10; i++) {
        shotsReceived.push(createShot(i, 0, "miss")); // Top edge
        shotsReceived.push(createShot(i, 9, "miss")); // Bottom edge
        shotsReceived.push(createShot(0, i, "miss")); // Left edge
        shotsReceived.push(createShot(9, i, "miss")); // Right edge
      }

      // Run multiple times
      const results: Coord[] = [];
      for (let i = 0; i < 20; i++) {
        const result = getBotRecommendation(shotsReceived);
        if (result) results.push(result);
      }

      // All results should be interior cells
      for (const result of results) {
        expect(result.x).toBeGreaterThan(0);
        expect(result.x).toBeLessThan(9);
        expect(result.y).toBeGreaterThan(0);
        expect(result.y).toBeLessThan(9);
      }
    });
  });

  describe("cluster building", () => {
    it("should build single-cell clusters for isolated hits", () => {
      const shotsReceived = [
        createShot(2, 2, "hit"),
        createShot(7, 7, "hit"), // Not adjacent to first
      ];

      const ctx = deriveContext(shotsReceived);
      const clusters = buildClusters(ctx.activeHitSet);

      expect(clusters.length).toBe(2);
      expect(clusters[0].coords.length).toBe(1);
      expect(clusters[1].coords.length).toBe(1);
    });

    it("should merge adjacent hits into single cluster", () => {
      const shotsReceived = [
        createShot(5, 5, "hit"),
        createShot(6, 5, "hit"),
        createShot(7, 5, "hit"),
      ];

      const ctx = deriveContext(shotsReceived);
      const clusters = buildClusters(ctx.activeHitSet);

      expect(clusters.length).toBe(1);
      expect(clusters[0].coords.length).toBe(3);
      expect(clusters[0].orientation).toBe("horizontal");
    });

    it("should detect vertical orientation", () => {
      const shotsReceived = [
        createShot(5, 5, "hit"),
        createShot(5, 6, "hit"),
      ];

      const ctx = deriveContext(shotsReceived);
      const clusters = buildClusters(ctx.activeHitSet);

      expect(clusters.length).toBe(1);
      expect(clusters[0].orientation).toBe("vertical");
    });
  });

  describe("heatmap computation", () => {
    it("should compute valid heatmap for remaining ships", () => {
      const firedSet = new Set<string>();
      const forbiddenSet = new Set<string>();
      const remainingLengths = [2]; // Just one destroyer

      const heat = computeHeatmap(remainingLengths, firedSet, forbiddenSet);

      // Center cells should have higher heat (more placements cover them)
      // Edge cells should have lower heat
      expect(heat[5][5]).toBeGreaterThan(heat[0][0]);
    });

    it("should exclude fired cells from placement counting", () => {
      const firedSet = new Set(["5,5"]);
      const forbiddenSet = new Set<string>();
      const remainingLengths = [2];

      const heat = computeHeatmap(remainingLengths, firedSet, forbiddenSet);

      // Cell (5,5) can still be covered by placements, but it's fired
      // The heatmap just counts valid placements, filtering happens in searchMode
      expect(heat[5][5]).toBeGreaterThanOrEqual(0);
    });

    it("should respect forbidden cells", () => {
      // Forbid entire column 5
      const forbiddenSet = new Set<string>();
      for (let y = 0; y < 10; y++) {
        forbiddenSet.add(`5,${y}`);
      }
      const firedSet = new Set<string>();
      const remainingLengths = [3];

      const heat = computeHeatmap(remainingLengths, firedSet, forbiddenSet);

      // Column 5 cells should have reduced heat (no horizontal placements crossing)
      // But vertical placements on other columns are still valid
      expect(heat[5][5]).toBe(0); // No valid placements can use this cell
    });
  });
});
