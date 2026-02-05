/**
 * Strategist AI Adapter - Wraps server-side algorithm for client use.
 *
 * The core algorithm lives in convex/games/bot/strategist.ts.
 * This adapter handles type conversion between client and server formats.
 */

import { getBotRecommendation } from "@server/games/bot/strategist";
import type { Shot, ShotResult } from "@server/games/helpers";
import { type Coordinate, type EnemyCellState } from "../types";
import { stringToCoord, coordToString } from "./coordinates";

/**
 * Map EnemyCellState to ShotResult (only fired states).
 * Returns null for non-shot states (neutral, hover, disabled).
 */
function cellStateToShotResult(state: EnemyCellState): ShotResult | null {
  if (state === "miss") return "miss";
  if (state === "hit") return "hit";
  if (state === "sunk") return "sunk";
  return null;
}

/**
 * Convert client Map format to server Shot[] format.
 * Only includes cells that have been fired upon.
 */
function convertToShots(enemyCells: Map<Coordinate, EnemyCellState>): Shot[] {
  const shots: Shot[] = [];
  enemyCells.forEach((state, coord) => {
    const result = cellStateToShotResult(state);
    if (result) {
      shots.push({
        coord: stringToCoord(coord),
        result,
        timestamp: 0,
      });
    }
  });
  return shots;
}

/**
 * Strategist AI: Suggests the optimal next target.
 *
 * Delegates to the server-side algorithm after converting types.
 *
 * @param enemyCells Map of coordinates to their current state
 * @returns Recommended coordinate to fire at, or null if no valid targets
 */
export function getStrategistRecommendation(
  enemyCells: Map<Coordinate, EnemyCellState>
): Coordinate | null {
  const shots = convertToShots(enemyCells);
  const result = getBotRecommendation(shots);
  return result ? coordToString(result) : null;
}

/**
 * Format the strategist instruction text.
 */
export function formatStrategistInstruction(coord: Coordinate): string {
  return `Fire on ${coord}`;
}
