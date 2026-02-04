import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// =============================================================================
// CONSTANTS
// =============================================================================

const COUNTDOWN_DURATION_MS = 5000; // 5 seconds
const PLACEMENT_DURATION_MS = 120000; // 2 minutes
const TURN_DURATION_MS = 30000; // 30 seconds
const BOARD_SIZE = 10;

// Ship lengths by type - MUST match during placement validation
const SHIP_LENGTHS: Record<string, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2
};

// Required ships for a valid placement
const REQUIRED_SHIPS = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];

// =============================================================================
// TYPES
// =============================================================================

type ShipType = "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer";
type Orientation = "horizontal" | "vertical";
type ShotResult = "miss" | "hit" | "sunk";

interface Coord {
  x: number;
  y: number;
}

interface Ship {
  shipType: ShipType;
  origin: Coord;
  orientation: Orientation;
  length: number;
}

interface Shot {
  coord: Coord;
  result: ShotResult;
  sunkShipType?: ShipType;
}

interface Board {
  ships: Ship[];
  shotsReceived: Shot[];
}

// =============================================================================
// HELPERS
// =============================================================================

const now = () => Date.now();

/**
 * Get next sequence number for game events
 */
async function getNextSeq(ctx: { db: any }, gameId: Id<"games">): Promise<number> {
  const last = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_seq", (q: any) => q.eq("gameId", gameId))
    .order("desc")
    .first();
  return last ? last.seq + 1 : 1;
}

/**
 * Append event to game event log
 */
async function appendEvent(
  ctx: { db: any },
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
function getShipCells(ship: Ship): Coord[] {
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
function isInBounds(coord: Coord): boolean {
  return coord.x >= 0 && coord.x < BOARD_SIZE && coord.y >= 0 && coord.y < BOARD_SIZE;
}

/**
 * Check if two coordinates are equal
 */
function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Validate ship placement
 * - All 5 ships required
 * - Ship length must match shipType
 * - All cells must be in bounds
 * - No overlapping ships
 */
function validatePlacement(ships: Ship[]): { valid: boolean; error?: string } {
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
function resolveShot(
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
          coordsEqual(c, coord) ||
          previousHits.some((h) => coordsEqual(h, c))
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
function allShipsSunk(board: Board): boolean {
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
function getOpponentDeviceId(
  players: { deviceId: string }[],
  currentDeviceId: string
): string | null {
  const opponent = players.find((p) => p.deviceId !== currentDeviceId);
  return opponent?.deviceId ?? null;
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new game
 * Phase: n/a (creates new game in lobby)
 */
export const createGame = mutation({
  args: {
    deviceId: v.string(),
    mode: v.union(v.literal("pvp"), v.literal("pve"))
  },
  handler: async (ctx, args) => {
    const timestamp = now();

    // Initialize empty boards for the host
    const boards: Record<string, Board> = {
      [args.deviceId]: { ships: [], shotsReceived: [] }
    };

    const gameId = await ctx.db.insert("games", {
      mode: args.mode,
      status: "lobby",
      hostDeviceId: args.deviceId,
      players: [
        {
          deviceId: args.deviceId,
          ready: false,
          joinedAt: timestamp,
          lastSeenAt: timestamp
        }
      ],
      boards,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    await appendEvent(ctx, gameId, "GAME_CREATED", {
      hostDeviceId: args.deviceId,
      mode: args.mode
    }, args.deviceId);

    return { gameId };
  }
});

/**
 * Join an existing game
 * Phase guard: lobby only
 */
export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string()
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (game.status !== "lobby") {
      throw new Error("Cannot join game: game is not in lobby phase");
    }

    const timestamp = now();
    const players = [...game.players];
    const boards = { ...game.boards };

    // Check if player already in game
    const existingIndex = players.findIndex(
      (p) => p.deviceId === args.deviceId
    );

    if (existingIndex >= 0) {
      // Update lastSeenAt
      players[existingIndex] = {
        ...players[existingIndex],
        lastSeenAt: timestamp
      };
    } else {
      // Check if game is full
      if (players.length >= 2) {
        throw new Error("Game is full");
      }

      // Add new player
      players.push({
        deviceId: args.deviceId,
        ready: false,
        joinedAt: timestamp,
        lastSeenAt: timestamp
      });

      // Initialize board for new player
      boards[args.deviceId] = { ships: [], shotsReceived: [] };

      await appendEvent(ctx, args.gameId, "PLAYER_JOINED", {
        deviceId: args.deviceId
      }, args.deviceId);
    }

    await ctx.db.patch(args.gameId, {
      players,
      boards,
      updatedAt: timestamp
    });

    return { ok: true };
  }
});

/**
 * Set player ready status
 * Phase guard: lobby only
 * Automatically starts countdown when both players are ready
 */
export const setReady = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    ready: v.boolean()
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (game.status !== "lobby") {
      throw new Error("Cannot set ready: game is not in lobby phase");
    }

    const timestamp = now();
    const players = game.players.map((player) =>
      player.deviceId === args.deviceId
        ? { ...player, ready: args.ready, lastSeenAt: timestamp }
        : player
    );

    await appendEvent(ctx, args.gameId, "PLAYER_READY_SET", {
      deviceId: args.deviceId,
      ready: args.ready
    }, args.deviceId);

    // Check if both players are ready to start countdown
    const allReady =
      players.length >= 2 && players.every((p) => p.ready);

    if (allReady) {
      await ctx.db.patch(args.gameId, {
        players,
        status: "countdown",
        countdownStartedAt: timestamp,
        countdownDurationMs: COUNTDOWN_DURATION_MS,
        updatedAt: timestamp
      });

      await appendEvent(ctx, args.gameId, "COUNTDOWN_STARTED", {
        countdownStartedAt: timestamp,
        countdownDurationMs: COUNTDOWN_DURATION_MS
      });
    } else {
      await ctx.db.patch(args.gameId, {
        players,
        updatedAt: timestamp
      });
    }

    return { ok: true };
  }
});

/**
 * Advance from countdown to placement phase
 * Phase guard: countdown only
 * Validates countdown timer has expired
 */
export const advanceFromCountdown = mutation({
  args: {
    gameId: v.id("games")
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (game.status !== "countdown") {
      throw new Error("Cannot advance: game is not in countdown phase");
    }

    // Validate countdown has expired
    const countdownEnd =
      (game.countdownStartedAt ?? 0) + (game.countdownDurationMs ?? 0);
    if (now() < countdownEnd) {
      throw new Error("Countdown has not expired yet");
    }

    const timestamp = now();

    await ctx.db.patch(args.gameId, {
      status: "placement",
      placementStartedAt: timestamp,
      placementDurationMs: PLACEMENT_DURATION_MS,
      updatedAt: timestamp
    });

    await appendEvent(ctx, args.gameId, "PLACEMENT_STARTED", {
      placementStartedAt: timestamp,
      placementDurationMs: PLACEMENT_DURATION_MS
    });

    return { ok: true };
  }
});

/**
 * Commit ship placement
 * Phase guard: placement only
 * Validates placement and starts battle when both players have committed
 */
export const commitPlacement = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    ships: v.array(
      v.object({
        shipType: v.union(
          v.literal("carrier"),
          v.literal("battleship"),
          v.literal("cruiser"),
          v.literal("submarine"),
          v.literal("destroyer")
        ),
        origin: v.object({ x: v.number(), y: v.number() }),
        orientation: v.union(v.literal("horizontal"), v.literal("vertical")),
        length: v.number()
      })
    )
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (game.status !== "placement") {
      throw new Error("Cannot commit placement: game is not in placement phase");
    }

    // Verify player is in game
    const player = game.players.find((p) => p.deviceId === args.deviceId);
    if (!player) {
      throw new Error("Player not in game");
    }

    // Validate placement
    const validation = validatePlacement(args.ships as Ship[]);
    if (!validation.valid) {
      throw new Error(`Invalid placement: ${validation.error}`);
    }

    const timestamp = now();
    const boards = { ...game.boards };

    // Update player's board with ships
    boards[args.deviceId] = {
      ...boards[args.deviceId],
      ships: args.ships as Ship[]
    };

    await appendEvent(ctx, args.gameId, "SHIP_PLACEMENT_COMMITTED", {
      deviceId: args.deviceId
    }, args.deviceId);

    // Check if both players have committed placements
    const allPlacementsCommitted = game.players.every((p) => {
      const playerBoard = p.deviceId === args.deviceId
        ? boards[p.deviceId]
        : game.boards[p.deviceId];
      return playerBoard && playerBoard.ships.length === 5;
    });

    if (allPlacementsCommitted) {
      // RANDOMIZE first turn
      const firstPlayer =
        game.players[Math.floor(Math.random() * game.players.length)];

      await ctx.db.patch(args.gameId, {
        boards,
        status: "battle",
        currentTurnDeviceId: firstPlayer.deviceId,
        turnStartedAt: timestamp,
        turnDurationMs: TURN_DURATION_MS,
        updatedAt: timestamp
      });

      await appendEvent(ctx, args.gameId, "BATTLE_STARTED", {
        firstTurnDeviceId: firstPlayer.deviceId
      });

      await appendEvent(ctx, args.gameId, "TURN_STARTED", {
        deviceId: firstPlayer.deviceId,
        turnStartedAt: timestamp,
        turnDurationMs: TURN_DURATION_MS
      });
    } else {
      await ctx.db.patch(args.gameId, {
        boards,
        updatedAt: timestamp
      });
    }

    return { ok: true };
  }
});

/**
 * Fire a shot at the enemy board
 * Phase guard: battle only
 * Validates turn order and resolves hit/miss/sunk
 */
export const fireShot = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    coord: v.object({ x: v.number(), y: v.number() })
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (game.status !== "battle") {
      throw new Error("Cannot fire: game is not in battle phase");
    }

    // Validate it's this player's turn
    if (game.currentTurnDeviceId !== args.deviceId) {
      throw new Error("Not your turn");
    }

    // Validate coordinate is in bounds
    if (!isInBounds(args.coord)) {
      throw new Error("Coordinate out of bounds");
    }

    // Get opponent's board
    const opponentDeviceId = getOpponentDeviceId(game.players, args.deviceId);
    if (!opponentDeviceId) {
      throw new Error("No opponent found");
    }

    const opponentBoard = game.boards[opponentDeviceId];
    if (!opponentBoard) {
      throw new Error("Opponent board not found");
    }

    // Check if already fired at this coordinate
    const alreadyFired = opponentBoard.shotsReceived.some((shot) =>
      coordsEqual(shot.coord, args.coord)
    );
    if (alreadyFired) {
      throw new Error("Already fired at this coordinate");
    }

    const timestamp = now();

    // Log SHOT_FIRED event
    await appendEvent(ctx, args.gameId, "SHOT_FIRED", {
      deviceId: args.deviceId,
      coord: args.coord
    }, args.deviceId);

    // Resolve the shot
    const { result, sunkShipType } = resolveShot(opponentBoard, args.coord);

    // Update opponent's board with the shot
    const boards = { ...game.boards };
    const newShot: Shot = {
      coord: args.coord,
      result,
      sunkShipType
    };
    boards[opponentDeviceId] = {
      ...opponentBoard,
      shotsReceived: [...opponentBoard.shotsReceived, newShot]
    };

    // Log SHOT_RESOLVED event
    await appendEvent(ctx, args.gameId, "SHOT_RESOLVED", {
      deviceId: args.deviceId,
      coord: args.coord,
      result,
      sunkShipType
    }, args.deviceId);

    // Check for win condition
    const updatedOpponentBoard = boards[opponentDeviceId];
    if (allShipsSunk(updatedOpponentBoard)) {
      // Game over - current player wins
      await ctx.db.patch(args.gameId, {
        boards,
        status: "finished",
        winnerDeviceId: args.deviceId,
        currentTurnDeviceId: undefined,
        turnStartedAt: undefined,
        updatedAt: timestamp
      });

      await appendEvent(ctx, args.gameId, "GAME_FINISHED", {
        winnerDeviceId: args.deviceId,
        reason: "all_ships_sunk"
      });

      return { result, sunkShipType, gameOver: true, winner: args.deviceId };
    }

    // Advance turn to opponent
    await ctx.db.patch(args.gameId, {
      boards,
      currentTurnDeviceId: opponentDeviceId,
      turnStartedAt: timestamp,
      turnDurationMs: TURN_DURATION_MS,
      updatedAt: timestamp
    });

    await appendEvent(ctx, args.gameId, "TURN_ADVANCED", {
      fromDeviceId: args.deviceId,
      toDeviceId: opponentDeviceId
    });

    await appendEvent(ctx, args.gameId, "TURN_STARTED", {
      deviceId: opponentDeviceId,
      turnStartedAt: timestamp,
      turnDurationMs: TURN_DURATION_MS
    });

    return { result, sunkShipType, gameOver: false };
  }
});

/**
 * Advance turn if current turn has expired
 * Phase guard: battle only
 */
export const advanceTurnIfExpired = mutation({
  args: {
    gameId: v.id("games")
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (game.status !== "battle") {
      throw new Error("Cannot advance turn: game is not in battle phase");
    }

    // Check if turn has expired
    const turnEnd =
      (game.turnStartedAt ?? 0) + (game.turnDurationMs ?? 0);
    if (now() < turnEnd) {
      return { skipped: false, reason: "Turn not expired" };
    }

    const currentDeviceId = game.currentTurnDeviceId;
    if (!currentDeviceId) {
      throw new Error("No current turn");
    }

    const opponentDeviceId = getOpponentDeviceId(game.players, currentDeviceId);
    if (!opponentDeviceId) {
      throw new Error("No opponent found");
    }

    const timestamp = now();

    // Log turn skipped event
    await appendEvent(ctx, args.gameId, "TURN_SKIPPED", {
      deviceId: currentDeviceId,
      reason: "timeout"
    });

    // Advance turn to opponent
    await ctx.db.patch(args.gameId, {
      currentTurnDeviceId: opponentDeviceId,
      turnStartedAt: timestamp,
      turnDurationMs: TURN_DURATION_MS,
      updatedAt: timestamp
    });

    await appendEvent(ctx, args.gameId, "TURN_ADVANCED", {
      fromDeviceId: currentDeviceId,
      toDeviceId: opponentDeviceId
    });

    await appendEvent(ctx, args.gameId, "TURN_STARTED", {
      deviceId: opponentDeviceId,
      turnStartedAt: timestamp,
      turnDurationMs: TURN_DURATION_MS
    });

    return { skipped: true, skippedDeviceId: currentDeviceId };
  }
});

/**
 * Forfeit the game
 * Phase guard: lobby, placement, or battle
 */
export const forfeitGame = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string()
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // PHASE GUARD
    if (
      game.status !== "lobby" &&
      game.status !== "placement" &&
      game.status !== "battle"
    ) {
      throw new Error("Cannot forfeit: game is not in a forfeitable phase");
    }

    // Verify player is in game
    const player = game.players.find((p) => p.deviceId === args.deviceId);
    if (!player) {
      throw new Error("Player not in game");
    }

    const timestamp = now();
    const opponentDeviceId = getOpponentDeviceId(game.players, args.deviceId);

    await appendEvent(ctx, args.gameId, "PLAYER_FORFEITED", {
      deviceId: args.deviceId
    }, args.deviceId);

    await ctx.db.patch(args.gameId, {
      status: "finished",
      winnerDeviceId: opponentDeviceId ?? undefined,
      currentTurnDeviceId: undefined,
      turnStartedAt: undefined,
      updatedAt: timestamp
    });

    await appendEvent(ctx, args.gameId, "GAME_FINISHED", {
      winnerDeviceId: opponentDeviceId,
      reason: "forfeit"
    });

    return { ok: true };
  }
});

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get game document
 */
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  }
});

/**
 * List game events with pagination
 */
export const listGameEvents = query({
  args: {
    gameId: v.id("games"),
    limit: v.number(),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const paginationOpts = {
      numItems: args.limit,
      cursor: args.cursor ?? null
    };

    return await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_seq", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .paginate(paginationOpts);
  }
});
