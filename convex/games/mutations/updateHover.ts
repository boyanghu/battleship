/**
 * Update hover position for real-time enemy hover visualization.
 * Only allowed during battle phase when it's the player's turn.
 */

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { isInBounds, now, type Coord } from "../helpers";

export const updateHoverHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string; coord: Coord | null }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // Only allow in PvP mode
  if (game.mode !== "pvp") {
    return { ok: false, reason: "PvE mode - hover sync disabled" };
  }

  // PHASE GUARD: Only battle phase
  if (game.status !== "battle") {
    return { ok: false, reason: "Not in battle phase" };
  }

  // TURN GUARD: Only the current turn player can update hover
  if (game.currentTurnDeviceId !== args.deviceId) {
    return { ok: false, reason: "Not your turn" };
  }

  // If coord is null, clear hover state
  if (args.coord === null) {
    await ctx.db.patch(args.gameId, {
      hoverState: undefined
    });
    return { ok: true };
  }

  // Validate coordinate is in bounds
  if (!isInBounds(args.coord)) {
    return { ok: false, reason: "Coordinate out of bounds" };
  }

  // Update hover state
  await ctx.db.patch(args.gameId, {
    hoverState: {
      deviceId: args.deviceId,
      coord: args.coord,
      updatedAt: now()
    }
  });

  return { ok: true };
};
