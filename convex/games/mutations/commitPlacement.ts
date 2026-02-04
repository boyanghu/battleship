import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
import { appendEvent, now, validatePlacement, type Ship } from "../helpers";

export const commitPlacementHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string; ships: Ship[] }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  if (game.status !== "placement") {
    throw new Error(
      "Cannot commit placement: game is not in placement phase"
    );
  }

  // Verify player is in game
  const player = game.players.find((p) => p.deviceId === args.deviceId);
  if (!player) {
    throw new Error("Player not in game");
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

  await appendEvent(
    ctx,
    args.gameId,
    "SHIP_PLACEMENT_COMMITTED",
    { deviceId: args.deviceId },
    args.deviceId
  );

  // Check if both players have committed placements
  const allPlacementsCommitted = game.players.every((p) => {
    const playerBoard =
      p.deviceId === args.deviceId ? boards[p.deviceId] : game.boards[p.deviceId];
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
};
