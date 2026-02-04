import type { MutationCtx } from "../../_generated/server";
import { appendEvent, now, type Board } from "../helpers";

type Mode = "pvp" | "pve";

export const createGameHandler = async (
  ctx: MutationCtx,
  args: { deviceId: string; mode: Mode }
) => {
  const timestamp = now();

  // Initialize empty boards for the host
  const boards: Record<string, Board> = {
    [args.deviceId]: { ships: [], shotsReceived: [] }
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
