import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";

export const getGameHandler = async (
  ctx: QueryCtx,
  args: { gameId: Id<"games"> }
) => {
  return await ctx.db.get(args.gameId);
};
