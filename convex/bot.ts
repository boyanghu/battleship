/**
 * Bot internal functions - scheduled tasks for AI player.
 * 
 * These are internal mutations called by the scheduler, not exposed to clients.
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  BOT_DEVICE_ID,
  TURN_DURATION_MS
} from "./lib/constants";
import {
  allShipsSunk,
  appendEvent,
  getOpponentDeviceId,
  now,
  resolveShot,
  type Shot
} from "./games/helpers";
import { getBotRecommendation } from "./games/bot/strategist";

/**
 * Internal mutation called by the scheduler to execute the bot's move.
 * Validates game state before firing to handle edge cases.
 */
export const executeBotMove = internalMutation({
  args: {
    gameId: v.id("games"),
    turnStartedAt: v.number() // Used to validate we're still on the same turn
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      // Game was deleted, do nothing
      return;
    }

    // Validate game is still in battle phase
    if (game.status !== "battle") {
      return;
    }

    // Validate it's still the bot's turn
    if (game.currentTurnDeviceId !== BOT_DEVICE_ID) {
      return;
    }

    // Validate this is the same turn we scheduled for (prevents double-firing)
    if (game.turnStartedAt !== args.turnStartedAt) {
      return;
    }

    // Get the player's board (bot fires at player)
    const playerDeviceId = getOpponentDeviceId(game.players, BOT_DEVICE_ID);
    if (!playerDeviceId) {
      return;
    }

    const playerBoard = game.boards[playerDeviceId];
    if (!playerBoard) {
      return;
    }

    // Get bot's recommendation using strategist algorithm
    const targetCoord = getBotRecommendation(playerBoard.shotsReceived);
    if (!targetCoord) {
      // No valid targets - shouldn't happen unless board is full
      return;
    }

    const timestamp = now();

    // Log SHOT_FIRED event
    await appendEvent(
      ctx,
      args.gameId,
      "SHOT_FIRED",
      { deviceId: BOT_DEVICE_ID, coord: targetCoord },
      BOT_DEVICE_ID
    );

    // Resolve the shot
    const { result, sunkShipType } = resolveShot(playerBoard, targetCoord);

    // Update player's board with the shot
    const boards = { ...game.boards };
    const newShot: Shot = {
      coord: targetCoord,
      result,
      sunkShipType,
      timestamp
    };
    boards[playerDeviceId] = {
      ...playerBoard,
      shotsReceived: [...playerBoard.shotsReceived, newShot]
    };

    // Log SHOT_RESOLVED event
    await appendEvent(
      ctx,
      args.gameId,
      "SHOT_RESOLVED",
      { deviceId: BOT_DEVICE_ID, coord: targetCoord, result, sunkShipType },
      BOT_DEVICE_ID
    );

    // Check for win condition
    const updatedPlayerBoard = boards[playerDeviceId];
    if (allShipsSunk(updatedPlayerBoard)) {
      // Bot wins
      await ctx.db.patch(args.gameId, {
        boards,
        status: "finished",
        winnerDeviceId: BOT_DEVICE_ID,
        currentTurnDeviceId: undefined,
        turnStartedAt: undefined,
        updatedAt: timestamp
      });

      await appendEvent(ctx, args.gameId, "GAME_FINISHED", {
        winnerDeviceId: BOT_DEVICE_ID,
        reason: "all_ships_sunk"
      });

      return;
    }

    // Advance turn to player
    await ctx.db.patch(args.gameId, {
      boards,
      currentTurnDeviceId: playerDeviceId,
      turnStartedAt: timestamp,
      turnDurationMs: TURN_DURATION_MS,
      updatedAt: timestamp
    });

    await appendEvent(ctx, args.gameId, "TURN_ADVANCED", {
      fromDeviceId: BOT_DEVICE_ID,
      toDeviceId: playerDeviceId
    });

    await appendEvent(ctx, args.gameId, "TURN_STARTED", {
      deviceId: playerDeviceId,
      turnStartedAt: timestamp,
      turnDurationMs: TURN_DURATION_MS
    });
  }
});
