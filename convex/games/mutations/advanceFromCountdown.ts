import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { PLACEMENT_DURATION_MS } from "../../lib/constants";
import { appendEvent, now } from "../helpers";

export const advanceFromCountdownHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games"> }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD - idempotent: return early if already past countdown
  if (game.status !== "countdown") {
    return { ok: true, alreadyAdvanced: true };
  }

  // Validate countdown has expired
  const countdownEnd =
    (game.countdownStartedAt ?? 0) + (game.countdownDurationMs ?? 0);
  if (now() < countdownEnd) {
    throw new Error("Countdown has not expired yet");
  }

  const timestamp = now();

  await ctx.db.patch(args.gameId, {
    status: "placement",
    placementStartedAt: timestamp,
    placementDurationMs: PLACEMENT_DURATION_MS,
    updatedAt: timestamp
  });

  await appendEvent(ctx, args.gameId, "PLACEMENT_STARTED", {
    placementStartedAt: timestamp,
    placementDurationMs: PLACEMENT_DURATION_MS
  });

  return { ok: true };
};
