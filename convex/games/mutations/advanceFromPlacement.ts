import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
import { appendEvent, now } from "../helpers";
import { scheduleBotMoveIfNeeded } from "../bot";

export const advanceFromPlacementHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games"> }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD - idempotent: return early if already past placement
  if (game.status !== "placement") {
    return { ok: true, alreadyAdvanced: true };
  }

  // Validate placement timer has expired
  const placementEnd =
    (game.placementStartedAt ?? 0) + (game.placementDurationMs ?? 0);
  if (now() < placementEnd) {
    throw new Error("Placement timer has not expired yet");
  }

  const timestamp = now();

  // Mark all players as committed (auto-commit on timer expiry)
  const updatedPlayers = game.players.map((p) => ({
    ...p,
    placementCommitted: true
  }));

  // Log auto-commit events for players who hadn't committed
  for (const player of game.players) {
    if (!player.placementCommitted) {
      await appendEvent(
        ctx,
        args.gameId,
        "SHIP_PLACEMENT_COMMITTED",
        { deviceId: player.deviceId, autoCommitted: true },
        player.deviceId
      );
    }
  }

  // RANDOMIZE first turn
  const firstPlayer =
    updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];

  await ctx.db.patch(args.gameId, {
    players: updatedPlayers,
    status: "battle",
    currentTurnDeviceId: firstPlayer.deviceId,
    turnStartedAt: timestamp,
    turnDurationMs: TURN_DURATION_MS,
    updatedAt: timestamp
  });

  await appendEvent(ctx, args.gameId, "BATTLE_STARTED", {
    firstTurnDeviceId: firstPlayer.deviceId,
    timerExpired: true
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

  return { ok: true };
};
