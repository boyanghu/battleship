import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
import {
  advanceTurn,
  allShipsSunk,
  appendEvent,
  assertPhase,
  coordsEqual,
  getOpponentDeviceId,
  isInBounds,
  now,
  processShot,
  type Coord
} from "../helpers";
import { scheduleBotMoveIfNeeded } from "../bot";

/**
 * Fire a shot at the opponent's board.
 *
 * Time Complexity: O(S * L + H) where S = ships (5), L = max length (5), H = shots
 *   - processShot: O(S * L) for hit detection
 *   - allShipsSunk: O(S * L * H) for win check
 *   - advanceTurn: O(1) for database updates
 *   - In practice: O(1) constant for standard Battleship game sizes
 */
export const fireShotHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string; coord: Coord }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  assertPhase(game.status, "battle", "fire");

  // Validate it's this player's turn
  if (game.currentTurnDeviceId !== args.deviceId) {
    throw new Error("Not your turn");
  }

  // Validate coordinate is in bounds
  if (!isInBounds(args.coord)) {
    throw new Error("Coordinate out of bounds");
  }

  // Get opponent's board
  const opponentDeviceId = getOpponentDeviceId(game.players, args.deviceId);
  if (!opponentDeviceId) {
    throw new Error("No opponent found");
  }

  const opponentBoard = game.boards[opponentDeviceId];
  if (!opponentBoard) {
    throw new Error("Opponent board not found");
  }

  // Check if already fired at this coordinate
  const alreadyFired = opponentBoard.shotsReceived.some((shot) =>
    coordsEqual(shot.coord, args.coord)
  );
  if (alreadyFired) {
    throw new Error("Already fired at this coordinate");
  }

  const timestamp = now();

  // Log SHOT_FIRED event
  await appendEvent(
    ctx,
    args.gameId,
    "SHOT_FIRED",
    { deviceId: args.deviceId, coord: args.coord },
    args.deviceId
  );

  // Process the shot - resolve and update board
  const { result, sunkShipType, sunkShipCells, updatedBoards } = processShot(
    game.boards,
    opponentDeviceId,
    args.coord,
    timestamp
  );

  // Log SHOT_RESOLVED event
  await appendEvent(
    ctx,
    args.gameId,
    "SHOT_RESOLVED",
    { deviceId: args.deviceId, coord: args.coord, result, sunkShipType, sunkShipCells },
    args.deviceId
  );

  // Check for win condition
  const updatedOpponentBoard = updatedBoards[opponentDeviceId];
  if (allShipsSunk(updatedOpponentBoard)) {
    // Game over - current player wins
    await ctx.db.patch(args.gameId, {
      boards: updatedBoards,
      status: "finished",
      winnerDeviceId: args.deviceId,
      currentTurnDeviceId: undefined,
      turnStartedAt: undefined,
      updatedAt: timestamp,
      hoverState: undefined // Clear hover when game ends
    });

    await appendEvent(ctx, args.gameId, "GAME_FINISHED", {
      winnerDeviceId: args.deviceId,
      reason: "all_ships_sunk"
    });

    return { result, sunkShipType, gameOver: true, winner: args.deviceId };
  }

  // Update boards first
  await ctx.db.patch(args.gameId, {
    boards: updatedBoards,
    updatedAt: timestamp
  });

  // Advance turn to opponent
  await advanceTurn(
    ctx,
    args.gameId,
    args.deviceId,
    opponentDeviceId,
    TURN_DURATION_MS,
    timestamp
  );

  // Schedule bot move if it's the bot's turn (PvE mode)
  await scheduleBotMoveIfNeeded(ctx, args.gameId, {
    mode: game.mode,
    status: "battle",
    currentTurnDeviceId: opponentDeviceId,
    turnStartedAt: timestamp
  });

  return { result, sunkShipType, gameOver: false };
};
