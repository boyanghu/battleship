/**
 * Server-side Strategist AI for Bot player.
 *
 * Human-like AI with two modes:
 * - HUNT MODE: Intelligently finish ships once hits occur (cluster-based line extension)
 * - SEARCH MODE: Probability heatmap based on remaining ship lengths
 *
 * Features:
 * - Sink exclusion: Uses sunkShipCells to avoid wasting shots on resolved areas
 * - Weighted randomness: Picks among top candidates, not always the single best cell
 *
 * Overall Time Complexity: O(n * L) where n = BOARD_SIZE^2 (100), L = sum of ship lengths
 */

import { BOARD_SIZE, SHIP_LENGTHS } from "../../lib/constants";
import type { Coord, Shot, ShipType } from "../helpers";
import { isInBounds } from "../helpers";

// =============================================================================
// CONSTANTS
// =============================================================================

// Adjacent directions (4-neighbor: up, down, left, right)
const DIRECTIONS_4 = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 }, // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 }, // right
];

// All 8 directions (for forbidden neighbors around sunk ships)
const DIRECTIONS_8 = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 }, // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 }, // right
  { dx: -1, dy: -1 }, // up-left
  { dx: 1, dy: -1 }, // up-right
  { dx: -1, dy: 1 }, // down-left
  { dx: 1, dy: 1 }, // down-right
];

// Top K candidates for weighted random selection
const TOP_K = 15;

// Whether ships can touch (if true, forbid 8-neighbors of sunk ships)
const SHIPS_CAN_TOUCH = true; // Standard Battleship rules allow touching

// =============================================================================
// TYPES
// =============================================================================

/**
 * Strategy context with derived sets for O(1) lookups.
 */
interface StrategyContext {
  firedSet: Set<string>; // "x,y" keys of all fired coords
  missSet: Set<string>; // fired + result === "miss"
  hitSet: Set<string>; // fired + result === "hit"
  sunkCellsSet: Set<string>; // union of all sunkShipCells from sunk results
  activeHitSet: Set<string>; // hitSet minus sunkCellsSet (hits still needing completion)
  forbiddenSet: Set<string>; // sunkCellsSet (+ optional 8-neighbors if ships can't touch)
  remainingLengths: number[]; // Ship lengths not yet sunk
}

/**
 * A cluster of adjacent hit cells.
 */
interface HitCluster {
  coords: Coord[];
  orientation: "horizontal" | "vertical" | "unknown";
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert coordinate to string key for Set lookup.
 */
function coordKey(coord: Coord): string {
  return `${coord.x},${coord.y}`;
}

/**
 * Parse coordinate key back to Coord.
 */
function parseKey(key: string): Coord {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

/**
 * Pick a random element from an array.
 */
function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Weighted random pick from candidates based on score.
 * Higher scores have higher probability of being selected.
 */
function weightedRandomPick(candidates: { coord: Coord; score: number }[]): Coord | null {
  if (candidates.length === 0) return null;

  const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
  if (totalScore === 0) {
    // All scores are 0, fall back to uniform random
    return pickRandom(candidates.map((c) => c.coord));
  }

  let r = Math.random() * totalScore;
  for (const c of candidates) {
    r -= c.score;
    if (r <= 0) return c.coord;
  }
  return candidates[candidates.length - 1].coord;
}

// =============================================================================
// CONTEXT DERIVATION
// =============================================================================

/**
 * Derive all sets and data needed for strategy from shots received.
 *
 * Time Complexity: O(s) where s = number of shots
 */
function deriveContext(
  shotsReceived: Shot[],
  knownSunkShipTypes?: ShipType[]
): StrategyContext {
  const firedSet = new Set<string>();
  const missSet = new Set<string>();
  const hitSet = new Set<string>();
  const sunkCellsSet = new Set<string>();

  // Process all shots
  for (const shot of shotsReceived) {
    const key = coordKey(shot.coord);
    firedSet.add(key);

    if (shot.result === "miss") {
      missSet.add(key);
    } else if (shot.result === "hit") {
      hitSet.add(key);
    } else if (shot.result === "sunk") {
      // Add the sinking shot itself
      hitSet.add(key);

      // Add all sunk ship cells if available
      if (shot.sunkShipCells) {
        for (const cell of shot.sunkShipCells) {
          sunkCellsSet.add(coordKey(cell));
        }
      } else {
        // Fallback: just add the sinking shot coord
        sunkCellsSet.add(key);
      }
    }
  }

  // Active hits = hits that are not part of sunk ships
  const activeHitSet = new Set<string>();
  for (const key of hitSet) {
    if (!sunkCellsSet.has(key)) {
      activeHitSet.add(key);
    }
  }

  // Forbidden set starts with sunk cells
  const forbiddenSet = new Set(sunkCellsSet);

  // If ships cannot touch, also forbid 8-neighbors of sunk cells
  if (!SHIPS_CAN_TOUCH) {
    for (const key of sunkCellsSet) {
      const coord = parseKey(key);
      for (const { dx, dy } of DIRECTIONS_8) {
        const neighbor: Coord = { x: coord.x + dx, y: coord.y + dy };
        if (isInBounds(neighbor)) {
          forbiddenSet.add(coordKey(neighbor));
        }
      }
    }
  }

  // Calculate remaining ship lengths
  const allLengths = Object.values(SHIP_LENGTHS) as number[]; // [5, 4, 3, 3, 2]
  const remainingLengths = [...allLengths];

  // Remove sunk ship lengths
  const sunkTypes = knownSunkShipTypes || [];
  for (const shot of shotsReceived) {
    if (shot.result === "sunk" && shot.sunkShipType) {
      sunkTypes.push(shot.sunkShipType);
    }
  }

  // Remove duplicates (use Set for unique types from shots)
  const sunkTypesFromShots = new Set<ShipType>();
  for (const shot of shotsReceived) {
    if (shot.result === "sunk" && shot.sunkShipType) {
      sunkTypesFromShots.add(shot.sunkShipType);
    }
  }

  for (const shipType of sunkTypesFromShots) {
    const length = SHIP_LENGTHS[shipType];
    const idx = remainingLengths.indexOf(length);
    if (idx !== -1) {
      remainingLengths.splice(idx, 1);
    }
  }

  return {
    firedSet,
    missSet,
    hitSet,
    sunkCellsSet,
    activeHitSet,
    forbiddenSet,
    remainingLengths,
  };
}

// =============================================================================
// HUNT MODE
// =============================================================================

/**
 * Build clusters of adjacent active hits using BFS.
 *
 * Time Complexity: O(h) where h = number of active hits
 */
function buildClusters(activeHitSet: Set<string>): HitCluster[] {
  const visited = new Set<string>();
  const clusters: HitCluster[] = [];

  for (const startKey of activeHitSet) {
    if (visited.has(startKey)) continue;

    // BFS to find all connected hits
    const cluster: Coord[] = [];
    const queue: string[] = [startKey];
    visited.add(startKey);

    while (queue.length > 0) {
      const currentKey = queue.shift()!;
      const coord = parseKey(currentKey);
      cluster.push(coord);

      // Check 4-neighbors
      for (const { dx, dy } of DIRECTIONS_4) {
        const neighborKey = `${coord.x + dx},${coord.y + dy}`;
        if (activeHitSet.has(neighborKey) && !visited.has(neighborKey)) {
          visited.add(neighborKey);
          queue.push(neighborKey);
        }
      }
    }

    // Determine orientation
    let orientation: "horizontal" | "vertical" | "unknown" = "unknown";
    if (cluster.length >= 2) {
      const allSameX = cluster.every((c) => c.x === cluster[0].x);
      const allSameY = cluster.every((c) => c.y === cluster[0].y);
      if (allSameX) orientation = "vertical";
      else if (allSameY) orientation = "horizontal";
    }

    clusters.push({ coords: cluster, orientation });
  }

  return clusters;
}

/**
 * Get endpoint candidates for a linear cluster.
 * Returns the two cells at either end of the line that can extend it.
 */
function getEndpointCandidates(
  cluster: HitCluster,
  firedSet: Set<string>,
  forbiddenSet: Set<string>
): Coord[] {
  const candidates: Coord[] = [];
  const coords = cluster.coords;

  if (cluster.orientation === "horizontal") {
    // All have same y, extend along x
    const y = coords[0].y;
    const minX = Math.min(...coords.map((c) => c.x));
    const maxX = Math.max(...coords.map((c) => c.x));

    // Left endpoint
    const left: Coord = { x: minX - 1, y };
    if (isInBounds(left) && !firedSet.has(coordKey(left)) && !forbiddenSet.has(coordKey(left))) {
      candidates.push(left);
    }

    // Right endpoint
    const right: Coord = { x: maxX + 1, y };
    if (isInBounds(right) && !firedSet.has(coordKey(right)) && !forbiddenSet.has(coordKey(right))) {
      candidates.push(right);
    }
  } else if (cluster.orientation === "vertical") {
    // All have same x, extend along y
    const x = coords[0].x;
    const minY = Math.min(...coords.map((c) => c.y));
    const maxY = Math.max(...coords.map((c) => c.y));

    // Top endpoint
    const top: Coord = { x, y: minY - 1 };
    if (isInBounds(top) && !firedSet.has(coordKey(top)) && !forbiddenSet.has(coordKey(top))) {
      candidates.push(top);
    }

    // Bottom endpoint
    const bottom: Coord = { x, y: maxY + 1 };
    if (isInBounds(bottom) && !firedSet.has(coordKey(bottom)) && !forbiddenSet.has(coordKey(bottom))) {
      candidates.push(bottom);
    }
  }

  return candidates;
}

/**
 * Get 4-neighbor candidates for a single hit or ambiguous cluster.
 */
function getAdjacentCandidates(
  coords: Coord[],
  firedSet: Set<string>,
  forbiddenSet: Set<string>
): Coord[] {
  const candidateSet = new Set<string>();
  const candidates: Coord[] = [];

  for (const coord of coords) {
    for (const { dx, dy } of DIRECTIONS_4) {
      const neighbor: Coord = { x: coord.x + dx, y: coord.y + dy };
      const key = coordKey(neighbor);

      if (
        isInBounds(neighbor) &&
        !firedSet.has(key) &&
        !forbiddenSet.has(key) &&
        !candidateSet.has(key)
      ) {
        candidateSet.add(key);
        candidates.push(neighbor);
      }
    }
  }

  return candidates;
}

/**
 * Hunt mode: Finish ships intelligently once hits occur.
 *
 * Priority:
 * 1. Line-extension endpoints (clusters with known orientation)
 * 2. Single-hit adjacency (clusters with unknown orientation)
 *
 * Time Complexity: O(h) where h = number of active hits
 */
function huntMode(ctx: StrategyContext): Coord | null {
  const clusters = buildClusters(ctx.activeHitSet);

  // Separate clusters by type
  const linearClusters = clusters.filter(
    (c) => c.coords.length >= 2 && c.orientation !== "unknown"
  );
  const otherClusters = clusters.filter(
    (c) => c.coords.length === 1 || c.orientation === "unknown"
  );

  // Priority 1: Target endpoints of linear clusters
  const endpointCandidates: Coord[] = [];
  for (const cluster of linearClusters) {
    const endpoints = getEndpointCandidates(cluster, ctx.firedSet, ctx.forbiddenSet);
    endpointCandidates.push(...endpoints);
  }

  if (endpointCandidates.length > 0) {
    return pickRandom(endpointCandidates);
  }

  // Priority 2: Target adjacent cells of single hits or ambiguous clusters
  const adjacentCandidates: Coord[] = [];
  for (const cluster of otherClusters) {
    const adjacent = getAdjacentCandidates(cluster.coords, ctx.firedSet, ctx.forbiddenSet);
    adjacentCandidates.push(...adjacent);
  }

  if (adjacentCandidates.length > 0) {
    return pickRandom(adjacentCandidates);
  }

  // No valid hunt targets (shouldn't happen if activeHitSet is non-empty)
  return null;
}

// =============================================================================
// SEARCH MODE (HEATMAP)
// =============================================================================

/**
 * Compute probability heatmap based on remaining ship lengths.
 *
 * For each cell, count how many valid ship placements would cover it.
 * Valid placement = L-cell segment (horizontal/vertical) that doesn't overlap
 * with fired cells or forbidden cells.
 *
 * Time Complexity: O(n * L) where n = board cells (100), L = total ship lengths
 */
function computeHeatmap(
  remainingLengths: number[],
  firedSet: Set<string>,
  forbiddenSet: Set<string>
): number[][] {
  // Initialize heatmap to zeros
  const heat: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );

  for (const length of remainingLengths) {
    // Horizontal placements
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x <= BOARD_SIZE - length; x++) {
        // Check if placement is valid
        let valid = true;
        for (let i = 0; i < length; i++) {
          const key = `${x + i},${y}`;
          if (firedSet.has(key) || forbiddenSet.has(key)) {
            valid = false;
            break;
          }
        }

        // If valid, increment heat for each cell
        if (valid) {
          for (let i = 0; i < length; i++) {
            heat[y][x + i]++;
          }
        }
      }
    }

    // Vertical placements
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y <= BOARD_SIZE - length; y++) {
        // Check if placement is valid
        let valid = true;
        for (let i = 0; i < length; i++) {
          const key = `${x},${y + i}`;
          if (firedSet.has(key) || forbiddenSet.has(key)) {
            valid = false;
            break;
          }
        }

        // If valid, increment heat for each cell
        if (valid) {
          for (let i = 0; i < length; i++) {
            heat[y + i][x]++;
          }
        }
      }
    }
  }

  return heat;
}

/**
 * Search mode: Use probability heatmap to find optimal targets.
 *
 * 1. Compute heatmap based on remaining ship lengths
 * 2. Get all unfired cells with their scores
 * 3. Select top K candidates
 * 4. Weighted random pick by score
 *
 * Time Complexity: O(n * L) where n = board cells (100), L = total ship lengths
 */
function searchMode(ctx: StrategyContext): Coord | null {
  const heat = computeHeatmap(ctx.remainingLengths, ctx.firedSet, ctx.forbiddenSet);

  // Collect all unfired cells with their scores
  const candidates: { coord: Coord; score: number }[] = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      if (!ctx.firedSet.has(key)) {
        candidates.push({ coord: { x, y }, score: heat[y][x] });
      }
    }
  }

  if (candidates.length === 0) {
    return null; // No valid targets
  }

  // Sort by score descending and take top K
  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(0, TOP_K);

  // If all top candidates have 0 score, fall back to random unfired
  if (topCandidates.every((c) => c.score === 0)) {
    return pickRandom(candidates.map((c) => c.coord));
  }

  // Weighted random pick from top candidates
  return weightedRandomPick(topCandidates);
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Strategist AI: Computes the optimal next target for the bot.
 *
 * Uses two modes:
 * - HUNT MODE: When there are active hits, intelligently finish ships
 * - SEARCH MODE: When no active hits, use probability heatmap
 *
 * @param opponentShotsReceived Shots the bot has fired at the opponent
 * @param knownSunkShipTypes Optional: Ship types known to be sunk
 * @returns Recommended coordinate to fire at, or null if no valid targets
 */
export function getBotRecommendation(
  opponentShotsReceived: Shot[],
  knownSunkShipTypes?: ShipType[]
): Coord | null {
  const ctx = deriveContext(opponentShotsReceived, knownSunkShipTypes);

  // Hunt mode if there are active hits
  if (ctx.activeHitSet.size > 0) {
    const huntResult = huntMode(ctx);
    if (huntResult) return huntResult;
  }

  // Search mode with probability heatmap
  return searchMode(ctx);
}

// =============================================================================
// EXPORTS FOR TESTING
// =============================================================================

export {
  deriveContext,
  huntMode,
  searchMode,
  buildClusters,
  computeHeatmap,
  coordKey,
  parseKey,
  weightedRandomPick,
  type StrategyContext,
  type HitCluster,
};
