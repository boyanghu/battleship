import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { COUNTDOWN_DURATION_MS } from "../../lib/constants";
import { appendEvent, assertPhase, now } from "../helpers";

export const setReadyHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string; ready: boolean }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  assertPhase(game.status, "lobby", "set ready");

  const timestamp = now();
  const players = game.players.map((player) =>
    player.deviceId === args.deviceId
      ? { ...player, ready: args.ready, lastSeenAt: timestamp }
      : player
  );

  await appendEvent(
    ctx,
    args.gameId,
    "PLAYER_READY_SET",
    { deviceId: args.deviceId, ready: args.ready },
    args.deviceId
  );

  // Check if both players are ready to start countdown
  const allReady = players.length >= 2 && players.every((p) => p.ready);

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
};
