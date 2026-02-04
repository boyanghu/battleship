/**
 * Helper to schedule bot move when it's the bot's turn.
 */

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import {
  BOT_DEVICE_ID,
  BOT_MIN_DELAY_MS,
  BOT_MAX_DELAY_MS
} from "../../lib/constants";
import { internal } from "../../_generated/api";

interface Game {
  mode: "pvp" | "pve";
  status: string;
  currentTurnDeviceId?: string;
  turnStartedAt?: number;
}

/**
 * Generates a random delay between BOT_MIN_DELAY_MS and BOT_MAX_DELAY_MS
 */
function getRandomBotDelay(): number {
  return (
    BOT_MIN_DELAY_MS +
    Math.floor(Math.random() * (BOT_MAX_DELAY_MS - BOT_MIN_DELAY_MS))
  );
}

/**
 * Schedules the bot's move if conditions are met:
 * - Game is PvE mode
 * - Game is in battle phase
 * - It's the bot's turn
 * - turnStartedAt is set
 * 
 * Call this after any turn change that might give control to the bot.
 */
export async function scheduleBotMoveIfNeeded(
  ctx: MutationCtx,
  gameId: Id<"games">,
  game: Game
): Promise<void> {
  // Only schedule for PvE games
  if (game.mode !== "pve") {
    return;
  }

  // Only during battle phase
  if (game.status !== "battle") {
    return;
  }

  // Only when it's the bot's turn
  if (game.currentTurnDeviceId !== BOT_DEVICE_ID) {
    return;
  }

  // Need turnStartedAt for validation
  if (!game.turnStartedAt) {
    return;
  }

  // Schedule the bot move after a random delay
  const delay = getRandomBotDelay();
  
  await ctx.scheduler.runAfter(delay, internal.bot.executeBotMove, {
    gameId,
    turnStartedAt: game.turnStartedAt
  });
}
