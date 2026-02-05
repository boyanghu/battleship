import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { MAX_TIMEOUTS, TURN_DURATION_MS } from "../../lib/constants";
import { advanceTurn, appendEvent, assertPhase, getOpponentDeviceId, now } from "../helpers";
import { scheduleBotMoveIfNeeded } from "../bot";

export const advanceTurnIfExpiredHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games"> }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  assertPhase(game.status, "battle", "advance turn");

  // Check if turn has expired
  const turnEnd = (game.turnStartedAt ?? 0) + (game.turnDurationMs ?? 0);
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

  // Increment timeout count for the player whose turn was skipped
  const updatedPlayers = game.players.map((p) => {
    if (p.deviceId === currentDeviceId) {
      return { ...p, timeoutCount: (p.timeoutCount ?? 0) + 1 };
    }
    return p;
  });

  // Get the updated timeout count
  const playerTimeoutCount = (updatedPlayers.find(p => p.deviceId === currentDeviceId)?.timeoutCount ?? 0);

  // Log turn skipped event
  await appendEvent(ctx, args.gameId, "TURN_SKIPPED", {
    deviceId: currentDeviceId,
    reason: "timeout",
    timeoutCount: playerTimeoutCount
  });

  // Check if player has exceeded max timeouts - auto-forfeit
  if (playerTimeoutCount >= MAX_TIMEOUTS) {
    // Log forfeit event
    await appendEvent(ctx, args.gameId, "PLAYER_FORFEITED", {
      deviceId: currentDeviceId,
      reason: "timeout_limit"
    });

    // Update game to finished with opponent as winner
    await ctx.db.patch(args.gameId, {
      status: "finished",
      winnerDeviceId: opponentDeviceId,
      currentTurnDeviceId: undefined,
      turnStartedAt: undefined,
      players: updatedPlayers,
      updatedAt: timestamp
    });

    // Log game finished event
    await appendEvent(ctx, args.gameId, "GAME_FINISHED", {
      winnerDeviceId: opponentDeviceId,
      reason: "timeout_forfeit"
    });

    return { skipped: true, skippedDeviceId: currentDeviceId, forfeited: true };
  }

  // Update players with new timeout count
  await ctx.db.patch(args.gameId, {
    players: updatedPlayers,
    updatedAt: timestamp
  });

  // Advance turn to opponent
  await advanceTurn(
    ctx,
    args.gameId,
    currentDeviceId,
    opponentDeviceId,
    TURN_DURATION_MS,
    timestamp
  );

  // Schedule bot move if it's the bot's turn (PvE mode)
  await scheduleBotMoveIfNeeded(ctx, args.gameId, {
    mode: game.mode,
    status: "battle",
    currentTurnDeviceId: opponentDeviceId,
    turnStartedAt: timestamp
  });

  return { skipped: true, skippedDeviceId: currentDeviceId, forfeited: false };
};
