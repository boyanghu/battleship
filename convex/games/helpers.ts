/**
 * Game helper functions and types
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  BOARD_SIZE,
  SHIP_LENGTHS,
  REQUIRED_SHIPS
} from "../lib/constants";

// =============================================================================
// TYPES
// =============================================================================

export type ShipType =
  | "carrier"
  | "battleship"
  | "cruiser"
  | "submarine"
  | "destroyer";

export type Orientation = "horizontal" | "vertical";
export type ShotResult = "miss" | "hit" | "sunk";

export interface Coord {
  x: number;
  y: number;
}

export interface Ship {
  shipType: ShipType;
  origin: Coord;
  orientation: Orientation;
  length: number;
}

export interface Shot {
  coord: Coord;
  result: ShotResult;
  sunkShipType?: ShipType;
}

export interface Board {
  ships: Ship[];
  shotsReceived: Shot[];
}

export interface Player {
  deviceId: string;
  ready: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const now = () => Date.now();

/**
 * Get next sequence number for game events
 */
export async function getNextSeq(
  ctx: MutationCtx | QueryCtx,
  gameId: Id<"games">
): Promise<number> {
  const last = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_seq", (q) => q.eq("gameId", gameId))
    .order("desc")
    .first();
  return last ? last.seq + 1 : 1;
}

/**
 * Append event to game event log
 */
export async function appendEvent(
  ctx: MutationCtx,
  gameId: Id<"games">,
  type: string,
  payload: unknown,
  actorDeviceId?: string
): Promise<number> {
  const seq = await getNextSeq(ctx, gameId);
  await ctx.db.insert("gameEvents", {
    gameId,
    seq,
    actorDeviceId,
    type,
    payload,
    createdAt: now()
  });
  return seq;
}

/**
 * Get all cells occupied by a ship
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

/**
 * Check if a coordinate is within the board bounds
 */
export function isInBounds(coord: Coord): boolean {
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
export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Validate ship placement
 * - All 5 ships required
 * - Ship length must match shipType
 * - All cells must be in bounds
 * - No overlapping ships
 */
export function validatePlacement(
  ships: Ship[]
): { valid: boolean; error?: string } {
  // Check all required ships are present
  const shipTypes = ships.map((s) => s.shipType);
  for (const required of REQUIRED_SHIPS) {
    if (!shipTypes.includes(required as ShipType)) {
      return { valid: false, error: `Missing required ship: ${required}` };
    }
  }

  // Check for duplicates
  const typeCounts: Record<string, number> = {};
  for (const ship of ships) {
    typeCounts[ship.shipType] = (typeCounts[ship.shipType] || 0) + 1;
    if (typeCounts[ship.shipType] > 1) {
      return { valid: false, error: `Duplicate ship type: ${ship.shipType}` };
    }
  }

  // Validate each ship
  const allCells: Coord[] = [];
  for (const ship of ships) {
    // Validate length matches shipType
    const expectedLength = SHIP_LENGTHS[ship.shipType];
    if (ship.length !== expectedLength) {
      return {
        valid: false,
        error: `Ship ${ship.shipType} has length ${ship.length}, expected ${expectedLength}`
      };
    }

    // Get all cells and validate bounds
    const cells = getShipCells(ship);
    for (const cell of cells) {
      if (!isInBounds(cell)) {
        return {
          valid: false,
          error: `Ship ${ship.shipType} extends out of bounds at (${cell.x}, ${cell.y})`
        };
      }

      // Check for overlap
      for (const existing of allCells) {
        if (coordsEqual(cell, existing)) {
          return {
            valid: false,
            error: `Ships overlap at (${cell.x}, ${cell.y})`
          };
        }
      }

      allCells.push(cell);
    }
  }

  return { valid: true };
}

/**
 * Resolve a shot against an enemy board
 */
export function resolveShot(
  board: Board,
  coord: Coord
): { result: ShotResult; sunkShipType?: ShipType } {
  // Check each ship for a hit
  for (const ship of board.ships) {
    const cells = getShipCells(ship);
    const hitCell = cells.find((c) => coordsEqual(c, coord));

    if (hitCell) {
      // Check if this sinks the ship
      const previousHits = board.shotsReceived
        .filter((s) => s.result === "hit" || s.result === "sunk")
        .map((s) => s.coord);

      const shipCellsHit = cells.filter(
        (c) =>
          coordsEqual(c, coord) || previousHits.some((h) => coordsEqual(h, c))
      );

      if (shipCellsHit.length === cells.length) {
        return { result: "sunk", sunkShipType: ship.shipType };
      }

      return { result: "hit" };
    }
  }

  return { result: "miss" };
}

/**
 * Check if all ships on a board are sunk
 */
export function allShipsSunk(board: Board): boolean {
  for (const ship of board.ships) {
    const cells = getShipCells(ship);
    const allCellsHit = cells.every((cell) =>
      board.shotsReceived.some(
        (shot) =>
          coordsEqual(shot.coord, cell) &&
          (shot.result === "hit" || shot.result === "sunk")
      )
    );

    if (!allCellsHit) {
      return false;
    }
  }

  return true;
}

/**
 * Get the other player's deviceId
 */
export function getOpponentDeviceId(
  players: { deviceId: string }[],
  currentDeviceId: string
): string | null {
  const opponent = players.find((p) => p.deviceId !== currentDeviceId);
  return opponent?.deviceId ?? null;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a valid random ship placement for all required ships.
 * Each call produces a unique random layout.
 */
export function generateRandomPlacement(): Ship[] {
  const ships: Ship[] = [];
  const occupiedCells: Set<string> = new Set();

  for (const shipType of REQUIRED_SHIPS) {
    const length = SHIP_LENGTHS[shipType];
    let placed = false;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!placed && attempts < maxAttempts) {
      attempts++;

      // Random orientation
      const orientation: Orientation =
        Math.random() < 0.5 ? "horizontal" : "vertical";

      // Calculate valid range based on orientation
      const maxX =
        orientation === "horizontal" ? BOARD_SIZE - length : BOARD_SIZE - 1;
      const maxY =
        orientation === "vertical" ? BOARD_SIZE - length : BOARD_SIZE - 1;

      const origin: Coord = {
        x: randomInt(0, maxX),
        y: randomInt(0, maxY)
      };

      const ship: Ship = {
        shipType: shipType as ShipType,
        origin,
        orientation,
        length
      };

      // Get all cells this ship would occupy
      const cells = getShipCells(ship);

      // Check for overlap with already placed ships
      const hasOverlap = cells.some((c) => occupiedCells.has(`${c.x},${c.y}`));

      if (!hasOverlap) {
        // Mark cells as occupied
        cells.forEach((c) => occupiedCells.add(`${c.x},${c.y}`));
        ships.push(ship);
        placed = true;
      }
    }

    if (!placed) {
      // This should never happen with a 10x10 board and standard ships
      throw new Error(`Failed to place ship: ${shipType}`);
    }
  }

  return ships;
}
