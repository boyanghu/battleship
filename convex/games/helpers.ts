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
  timestamp: number;
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

/**
 * Get current timestamp.
 * Time Complexity: O(1)
 */
export const now = () => Date.now();

/**
 * Get next sequence number for game events.
 * Uses indexed query for efficient lookup.
 *
 * Time Complexity: O(log n) where n = number of events (indexed query)
 *
 * @param ctx - Database context
 * @param gameId - Game to get sequence for
 * @returns Next sequence number
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
 * Append event to game event log.
 *
 * Time Complexity: O(log n) for getNextSeq + O(1) for insert
 *
 * @param ctx - Mutation context
 * @param gameId - Game ID
 * @param type - Event type
 * @param payload - Event payload
 * @param actorDeviceId - Optional actor device ID
 * @returns Sequence number of the inserted event
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
 * Get all cells occupied by a ship.
 *
 * Time Complexity: O(L) where L = ship length (max 5)
 *
 * @param ship - Ship to get cells for
 * @returns Array of coordinates
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
 * Check if a coordinate is within the board bounds.
 *
 * Time Complexity: O(1)
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
 * Check if two coordinates are equal.
 *
 * Time Complexity: O(1)
 */
export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Validate ship placement.
 * - All 5 ships required
 * - Ship length must match shipType
 * - All cells must be in bounds
 * - No overlapping ships
 *
 * Time Complexity: O(S * L * (S * L)) = O(S^2 * L^2)
 *   where S = number of ships (5), L = max ship length (5)
 *   For standard Battleship: O(625) = O(1) constant
 *   Note: Could be optimized to O(S * L) with a Set, but not needed for small constants
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
 * Resolve a shot against an enemy board.
 * Determines if the shot is a miss, hit, or sinks a ship.
 *
 * Time Complexity: O(S * L + H)
 *   where S = number of ships (5), L = max ship length (5), H = shots received
 *   For a game with ~50 shots: O(25 + 50) = O(75) = O(1) constant
 *
 * @param board - Target board
 * @param coord - Coordinate to fire at
 * @returns Shot result and sunk ship type if applicable
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
 * Check if all ships on a board are sunk.
 *
 * Time Complexity: O(S * L * H)
 *   where S = ships (5), L = max length (5), H = shots (max ~100)
 *   Worst case: O(2500) = O(1) constant for standard game
 *   Note: Could be optimized with Set lookup, but not needed for small constants
 *
 * @param board - Board to check
 * @returns true if all ships are sunk
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
 * Get the other player's deviceId.
 *
 * Time Complexity: O(P) where P = number of players (max 2) = O(1)
 *
 * @param players - List of players
 * @param currentDeviceId - Current player's device ID
 * @returns Opponent's device ID or null
 */
export function getOpponentDeviceId(
  players: { deviceId: string }[],
  currentDeviceId: string
): string | null {
  const opponent = players.find((p) => p.deviceId !== currentDeviceId);
  return opponent?.deviceId ?? null;
}

/**
 * Generate a random integer between min and max (inclusive).
 *
 * Time Complexity: O(1)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a valid random ship placement for all required ships.
 * Each call produces a unique random layout.
 *
 * Time Complexity: O(S * A * L)
 *   where S = ships (5), A = average attempts per ship, L = ship length (5)
 *   Using Set for O(1) overlap check.
 *   Expected case with sparse board: A is small (usually 1-5)
 *   Worst case: O(5 * 1000 * 5) = O(25000) but practically O(125)
 *
 * @returns Array of placed ships
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

// =============================================================================
// PHASE GUARD HELPERS
// =============================================================================

export type GameStatus =
  | "lobby"
  | "countdown"
  | "placement"
  | "battle"
  | "finished";

/**
 * Validate that a game is in the expected phase.
 * Throws an error if the game is not in the expected phase.
 *
 * Time Complexity: O(1)
 *
 * @param gameStatus - Current game status
 * @param expectedPhase - Expected phase(s) (single or array)
 * @param action - Description of the action being attempted (for error message)
 * @throws Error if game is not in expected phase
 */
export function assertPhase(
  gameStatus: string | undefined,
  expectedPhase: GameStatus | GameStatus[],
  action: string
): void {
  const phases = Array.isArray(expectedPhase) ? expectedPhase : [expectedPhase];

  if (!gameStatus || !phases.includes(gameStatus as GameStatus)) {
    const phasesStr = phases.join(" or ");
    throw new Error(
      `Cannot ${action}: game is not in ${phasesStr} phase (current: ${gameStatus ?? "unknown"})`
    );
  }
}

/**
 * Check if a game is in the expected phase.
 * Returns boolean instead of throwing.
 *
 * Time Complexity: O(1)
 *
 * @param gameStatus - Current game status
 * @param expectedPhase - Expected phase(s) (single or array)
 * @returns true if game is in expected phase
 */
export function isInPhase(
  gameStatus: string | undefined,
  expectedPhase: GameStatus | GameStatus[]
): boolean {
  const phases = Array.isArray(expectedPhase) ? expectedPhase : [expectedPhase];
  return !!gameStatus && phases.includes(gameStatus as GameStatus);
}

// =============================================================================
// SHOT PROCESSING HELPERS
// =============================================================================

/**
 * Process a shot against an opponent's board.
 * - Creates the shot record
 * - Updates the board with the shot
 * - Returns the result and updated boards
 *
 * Time Complexity: O(s * c) where s = number of ships, c = cells per ship
 *                  For standard Battleship (5 ships, max 5 cells each): O(25)
 *
 * @param boards - Current game boards
 * @param targetDeviceId - Device ID of the board being shot at
 * @param coord - Coordinate to fire at
 * @param timestamp - Timestamp of the shot
 * @returns Shot result, sunk ship type if applicable, and updated boards
 */
export function processShot(
  boards: Record<string, Board>,
  targetDeviceId: string,
  coord: Coord,
  timestamp: number
): {
  result: ShotResult;
  sunkShipType?: ShipType;
  updatedBoards: Record<string, Board>;
} {
  const targetBoard = boards[targetDeviceId];
  if (!targetBoard) {
    throw new Error("Target board not found");
  }

  // Resolve the shot
  const { result, sunkShipType } = resolveShot(targetBoard, coord);

  // Create the shot record
  const newShot: Shot = {
    coord,
    result,
    sunkShipType,
    timestamp
  };

  // Update the target board with the new shot
  const updatedBoards = { ...boards };
  updatedBoards[targetDeviceId] = {
    ...targetBoard,
    shotsReceived: [...targetBoard.shotsReceived, newShot]
  };

  return { result, sunkShipType, updatedBoards };
}

// =============================================================================
// TURN ADVANCEMENT HELPERS
// =============================================================================

/**
 * Advance the turn to the next player.
 * - Updates currentTurnDeviceId to opponent
 * - Resets turnStartedAt and turnDurationMs
 * - Clears hoverState
 * - Logs TURN_ADVANCED and TURN_STARTED events
 *
 * Time Complexity: O(1) for database operations
 *
 * @param ctx - Convex mutation context
 * @param gameId - Game ID to update
 * @param fromDeviceId - Current player's device ID (turn is advancing FROM this player)
 * @param toDeviceId - Next player's device ID (turn is advancing TO this player)
 * @param turnDurationMs - Duration for the new turn in milliseconds
 * @param timestamp - Timestamp for the turn advancement
 */
export async function advanceTurn(
  ctx: MutationCtx,
  gameId: Id<"games">,
  fromDeviceId: string,
  toDeviceId: string,
  turnDurationMs: number,
  timestamp: number
): Promise<void> {
  // Update game state with new turn
  await ctx.db.patch(gameId, {
    currentTurnDeviceId: toDeviceId,
    turnStartedAt: timestamp,
    turnDurationMs,
    updatedAt: timestamp,
    hoverState: undefined // Clear hover when turn changes
  });

  // Log turn advancement events
  await appendEvent(ctx, gameId, "TURN_ADVANCED", {
    fromDeviceId,
    toDeviceId
  });

  await appendEvent(ctx, gameId, "TURN_STARTED", {
    deviceId: toDeviceId,
    turnStartedAt: timestamp,
    turnDurationMs
  });
}
