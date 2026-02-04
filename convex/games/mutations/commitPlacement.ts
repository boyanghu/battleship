import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
import { appendEvent, assertPhase, now, validatePlacement, type Ship } from "../helpers";
import { scheduleBotMoveIfNeeded } from "../bot";

/**
 * Commit ship placement for a player.
 *
 * Time Complexity: O(S^2 * L^2) where S = ships (5), L = max length (5)
 *   - validatePlacement: O(S^2 * L^2) for overlap detection
 *   - Player updates: O(P) where P = players (2)
 *   - Database operations: O(1)
 *   - In practice: O(625) = O(1) constant for standard Battleship
 */
export const commitPlacementHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string; ships: Ship[] }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  assertPhase(game.status, "placement", "commit placement");

  // Verify player is in game
  const playerIndex = game.players.findIndex((p) => p.deviceId === args.deviceId);
  if (playerIndex === -1) {
    throw new Error("Player not in game");
  }

  const player = game.players[playerIndex];

  // IDEMPOTENT: If player already committed, return early
  if (player.placementCommitted) {
    return { ok: true, alreadyCommitted: true };
  }

  // Validate placement
  const validation = validatePlacement(args.ships);
  if (!validation.valid) {
    throw new Error(`Invalid placement: ${validation.error}`);
  }

  const timestamp = now();
  const boards = { ...game.boards };

  // Update player's board with ships
  boards[args.deviceId] = {
    ...boards[args.deviceId],
    ships: args.ships
  };

  // Update players array to mark this player as committed
  const updatedPlayers = game.players.map((p, idx) =>
    idx === playerIndex ? { ...p, placementCommitted: true } : p
  );

  await appendEvent(
    ctx,
    args.gameId,
    "SHIP_PLACEMENT_COMMITTED",
    { deviceId: args.deviceId },
    args.deviceId
  );

  // Check if both players have explicitly committed placements
  const allPlacementsCommitted = updatedPlayers.every(
    (p) => p.placementCommitted === true
  );

  if (allPlacementsCommitted) {
    // RANDOMIZE first turn
    const firstPlayer =
      updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];

    await ctx.db.patch(args.gameId, {
      boards,
      players: updatedPlayers,
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

    // Schedule bot move if it's the bot's turn (PvE mode)
    await scheduleBotMoveIfNeeded(ctx, args.gameId, {
      mode: game.mode,
      status: "battle",
      currentTurnDeviceId: firstPlayer.deviceId,
      turnStartedAt: timestamp
    });
  } else {
    await ctx.db.patch(args.gameId, {
      boards,
      players: updatedPlayers,
      updatedAt: timestamp
    });
  }

  return { ok: true };
};
