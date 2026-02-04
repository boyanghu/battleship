/**
 * Game routes - exports all game mutations and queries
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Import handlers
import { createGameHandler } from "../games/mutations/createGame";
import { joinGameHandler } from "../games/mutations/joinGame";
import { setReadyHandler } from "../games/mutations/setReady";
import { advanceFromCountdownHandler } from "../games/mutations/advanceFromCountdown";
import { advanceFromPlacementHandler } from "../games/mutations/advanceFromPlacement";
import { commitPlacementHandler } from "../games/mutations/commitPlacement";
import { fireShotHandler } from "../games/mutations/fireShot";
import { advanceTurnIfExpiredHandler } from "../games/mutations/advanceTurnIfExpired";
import { forfeitGameHandler } from "../games/mutations/forfeitGame";
import { updateHoverHandler } from "../games/mutations/updateHover";
import { getGameHandler } from "../games/queries/getGame";
import { listGameEventsHandler } from "../games/queries/listGameEvents";

// =============================================================================
// SHARED VALIDATORS
// =============================================================================

const shipType = v.union(
  v.literal("carrier"),
  v.literal("battleship"),
  v.literal("cruiser"),
  v.literal("submarine"),
  v.literal("destroyer")
);

const coord = v.object({ x: v.number(), y: v.number() });

const ship = v.object({
  shipType,
  origin: coord,
  orientation: v.union(v.literal("horizontal"), v.literal("vertical")),
  length: v.number()
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new game
 * Phase: n/a (creates new game in lobby)
 */
export const createGame = mutation({
  args: {
    deviceId: v.string(),
    mode: v.union(v.literal("pvp"), v.literal("pve"))
  },
  handler: createGameHandler
});

/**
 * Join an existing game
 * Phase guard: lobby only
 */
export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string()
  },
  handler: joinGameHandler
});

/**
 * Set player ready status
 * Phase guard: lobby only
 * Automatically starts countdown when both players are ready
 */
export const setReady = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    ready: v.boolean()
  },
  handler: setReadyHandler
});

/**
 * Advance from countdown to placement phase
 * Phase guard: countdown only
 * Validates countdown timer has expired
 */
export const advanceFromCountdown = mutation({
  args: {
    gameId: v.id("games")
  },
  handler: advanceFromCountdownHandler
});

/**
 * Advance from placement to battle phase
 * Phase guard: placement only
 * Validates placement timer has expired
 * Auto-commits placements for players who haven't committed
 */
export const advanceFromPlacement = mutation({
  args: {
    gameId: v.id("games")
  },
  handler: advanceFromPlacementHandler
});

/**
 * Commit ship placement
 * Phase guard: placement only
 * Validates placement and starts battle when both players have committed
 */
export const commitPlacement = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    ships: v.array(ship)
  },
  handler: commitPlacementHandler
});

/**
 * Fire a shot at the enemy board
 * Phase guard: battle only
 * Validates turn order and resolves hit/miss/sunk
 */
export const fireShot = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    coord
  },
  handler: fireShotHandler
});

/**
 * Advance turn if current turn has expired
 * Phase guard: battle only
 */
export const advanceTurnIfExpired = mutation({
  args: {
    gameId: v.id("games")
  },
  handler: advanceTurnIfExpiredHandler
});

/**
 * Forfeit the game
 * Phase guard: lobby, placement, or battle
 */
export const forfeitGame = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string()
  },
  handler: forfeitGameHandler
});

/**
 * Update hover position for real-time enemy hover visualization
 * Phase guard: battle only (PvP only)
 * Turn guard: only current turn player
 */
export const updateHover = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    coord: v.union(coord, v.null())
  },
  handler: updateHoverHandler
});

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get game document
 * SECURITY: Only returns the requesting player's ships, never the opponent's
 */
export const getGame = query({
  args: {
    gameId: v.id("games"),
    deviceId: v.string()
  },
  handler: getGameHandler
});

/**
 * List game events with pagination
 */
export const listGameEvents = query({
  args: {
    gameId: v.id("games"),
    limit: v.number(),
    cursor: v.optional(v.string())
  },
  handler: listGameEventsHandler
});
