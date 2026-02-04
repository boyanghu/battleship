import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { appendEvent, assertPhase, now, generateRandomPlacement } from "../helpers";

export const joinGameHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  assertPhase(game.status, "lobby", "join game");

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

    // Generate random ship placement for new player
    const guestShips = generateRandomPlacement();
    boards[args.deviceId] = { ships: guestShips, shotsReceived: [] };

    await appendEvent(
      ctx,
      args.gameId,
      "PLAYER_JOINED",
      { deviceId: args.deviceId },
      args.deviceId
    );
  }

  await ctx.db.patch(args.gameId, {
    players,
    boards,
    updatedAt: timestamp
  });

  return { ok: true };
};
