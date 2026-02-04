import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
import { appendEvent, getOpponentDeviceId, now } from "../helpers";

export const advanceTurnIfExpiredHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games"> }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  if (game.status !== "battle") {
    throw new Error("Cannot advance turn: game is not in battle phase");
  }

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
};
