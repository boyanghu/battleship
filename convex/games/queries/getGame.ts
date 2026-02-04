import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import type { Board } from "../helpers";

export const getGameHandler = async (
  ctx: QueryCtx,
  args: { gameId: Id<"games">; deviceId: string }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) return null;

  // SECURITY: Filter boards to hide opponent ship positions
  // Players can only see their own ships, never the opponent's
  // We still return opponent's shotsReceived so we can render hit/miss markers
  const sanitizedBoards: Record<string, Board> = {};

  for (const [playerId, board] of Object.entries(game.boards)) {
    if (playerId === args.deviceId) {
      // Full board with ships for the requesting player
      sanitizedBoards[playerId] = board;
    } else {
      // Hide opponent ships - only show shots received (for battle phase rendering)
      sanitizedBoards[playerId] = {
        ships: [],
        shotsReceived: board.shotsReceived
      };
    }
  }

  return { ...game, boards: sanitizedBoards };
};
