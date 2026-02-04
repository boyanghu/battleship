import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { TURN_DURATION_MS } from "../../lib/constants";
import {
  allShipsSunk,
  appendEvent,
  coordsEqual,
  getOpponentDeviceId,
  isInBounds,
  now,
  resolveShot,
  type Coord,
  type Shot
} from "../helpers";
import { scheduleBotMoveIfNeeded } from "../bot";

export const fireShotHandler = async (
  ctx: MutationCtx,
  args: { gameId: Id<"games">; deviceId: string; coord: Coord }
) => {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // PHASE GUARD
  if (game.status !== "battle") {
    throw new Error("Cannot fire: game is not in battle phase");
  }

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

  // Resolve the shot
  const { result, sunkShipType } = resolveShot(opponentBoard, args.coord);

  // Update opponent's board with the shot
  const boards = { ...game.boards };
  const newShot: Shot = {
    coord: args.coord,
    result,
    sunkShipType,
    timestamp
  };
  boards[opponentDeviceId] = {
    ...opponentBoard,
    shotsReceived: [...opponentBoard.shotsReceived, newShot]
  };

  // Log SHOT_RESOLVED event
  await appendEvent(
    ctx,
    args.gameId,
    "SHOT_RESOLVED",
    { deviceId: args.deviceId, coord: args.coord, result, sunkShipType },
    args.deviceId
  );

  // Check for win condition
  const updatedOpponentBoard = boards[opponentDeviceId];
  if (allShipsSunk(updatedOpponentBoard)) {
    // Game over - current player wins
    await ctx.db.patch(args.gameId, {
      boards,
      status: "finished",
      winnerDeviceId: args.deviceId,
      currentTurnDeviceId: undefined,
      turnStartedAt: undefined,
      updatedAt: timestamp
    });

    await appendEvent(ctx, args.gameId, "GAME_FINISHED", {
      winnerDeviceId: args.deviceId,
      reason: "all_ships_sunk"
    });

    return { result, sunkShipType, gameOver: true, winner: args.deviceId };
  }

  // Advance turn to opponent
  await ctx.db.patch(args.gameId, {
    boards,
    currentTurnDeviceId: opponentDeviceId,
    turnStartedAt: timestamp,
    turnDurationMs: TURN_DURATION_MS,
    updatedAt: timestamp
  });

  await appendEvent(ctx, args.gameId, "TURN_ADVANCED", {
    fromDeviceId: args.deviceId,
    toDeviceId: opponentDeviceId
  });

  await appendEvent(ctx, args.gameId, "TURN_STARTED", {
    deviceId: opponentDeviceId,
    turnStartedAt: timestamp,
    turnDurationMs: TURN_DURATION_MS
  });

  // Schedule bot move if it's the bot's turn (PvE mode)
  await scheduleBotMoveIfNeeded(ctx, args.gameId, {
    mode: game.mode,
    status: "battle",
    currentTurnDeviceId: opponentDeviceId,
    turnStartedAt: timestamp
  });

  return { result, sunkShipType, gameOver: false };
};
