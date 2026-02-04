import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
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

  // Log turn skipped event
  await appendEvent(ctx, args.gameId, "TURN_SKIPPED", {
    deviceId: currentDeviceId,
    reason: "timeout"
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

  return { skipped: true, skippedDeviceId: currentDeviceId };
};
