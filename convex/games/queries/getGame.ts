import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import type { Board, Coord } from "../helpers";

// Consider hover stale after 2 seconds (allows for network latency)
const HOVER_STALE_MS = 2000;

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

  // Compute enemy hover coordinate for the requesting player
  // Only return hover if:
  // 1. We're in PvP mode and battle phase
  // 2. The hover is from the opponent (not the requesting player)
  // 3. The hover is not stale (within HOVER_STALE_MS)
  let enemyHoverCoord: Coord | null = null;

  if (
    game.mode === "pvp" &&
    game.status === "battle" &&
    game.hoverState &&
    game.hoverState.deviceId !== args.deviceId
  ) {
    const now = Date.now();
    const isStale = now - game.hoverState.updatedAt > HOVER_STALE_MS;
    if (!isStale) {
      enemyHoverCoord = game.hoverState.coord;
    }
  }

  // Return game with sanitized boards and enemy hover
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hoverState, ...gameWithoutHover } = game;
  return {
    ...gameWithoutHover,
    boards: sanitizedBoards,
    enemyHoverCoord
  };
};
