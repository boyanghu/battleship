import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { appendEvent, getOpponentDeviceId, now } from "../helpers";

export const forfeitGameHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string }
) => {
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

  await appendEvent(
    ctx,
    args.gameId,
    "PLAYER_FORFEITED",
    { deviceId: args.deviceId },
    args.deviceId
  );

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
};
