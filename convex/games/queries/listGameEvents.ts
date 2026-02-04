import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";

export const listGameEventsHandler = async (
  ctx: QueryCtx,
  args: { gameId: Id<"games">; limit: number; cursor?: string }
) => {
  const paginationOpts = {
    numItems: args.limit,
    cursor: args.cursor ?? null
  };

  return await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_seq", (q) => q.eq("gameId", args.gameId))
    .order("asc")
    .paginate(paginationOpts);
};
