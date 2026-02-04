import type { MutationCtx } from "../../_generated/server";
import {
  appendEvent,
  now,
  generateRandomPlacement,
  type Board
} from "../helpers";

type Mode = "pvp" | "pve";

export const createGameHandler = async (
  ctx: MutationCtx,
  args: { deviceId: string; mode: Mode }
) => {
  const timestamp = now();

  // Generate random ship placement for host immediately
  const hostShips = generateRandomPlacement();

  // Initialize boards with random ships for host
  const boards: Record<string, Board> = {
    [args.deviceId]: { ships: hostShips, shotsReceived: [] }
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

  await appendEvent(
    ctx,
    gameId,
    "GAME_CREATED",
    {
      hostDeviceId: args.deviceId,
      mode: args.mode
    },
    args.deviceId
  );

  return { gameId };
};
