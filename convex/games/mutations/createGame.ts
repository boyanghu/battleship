import type { MutationCtx } from "../../_generated/server";
import {
  BOT_DEVICE_ID,
  COUNTDOWN_DURATION_MS
} from "../../lib/constants";
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

  // For PvE mode, add the bot player immediately
  if (args.mode === "pve") {
    // Generate random ship placement for bot
    const botShips = generateRandomPlacement();
    boards[BOT_DEVICE_ID] = { ships: botShips, shotsReceived: [] };
  }

  // Build players array - for PvE, bot is added and both are ready
  const players =
    args.mode === "pve"
      ? [
          {
            deviceId: args.deviceId,
            ready: true, // Auto-ready for PvE
            placementCommitted: false, // Human still needs to commit
            joinedAt: timestamp,
            lastSeenAt: timestamp
          },
          {
            deviceId: BOT_DEVICE_ID,
            ready: true, // Bot is always ready
            placementCommitted: true, // Bot placement is pre-committed
            joinedAt: timestamp,
            lastSeenAt: timestamp
          }
        ]
      : [
          {
            deviceId: args.deviceId,
            ready: false,
            joinedAt: timestamp,
            lastSeenAt: timestamp
          }
        ];

  // For PvE, skip lobby and go straight to countdown
  const status = args.mode === "pve" ? "countdown" : "lobby";

  const gameId = await ctx.db.insert("games", {
    mode: args.mode,
    status,
    hostDeviceId: args.deviceId,
    players,
    boards,
    // Add countdown timing for PvE (auto-start)
    ...(args.mode === "pve"
      ? {
          countdownStartedAt: timestamp,
          countdownDurationMs: COUNTDOWN_DURATION_MS
        }
      : {}),
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

  // Log countdown start for PvE
  if (args.mode === "pve") {
    await appendEvent(ctx, gameId, "COUNTDOWN_STARTED", {
      countdownStartedAt: timestamp,
      countdownDurationMs: COUNTDOWN_DURATION_MS
    });
  }

  return { gameId };
};
