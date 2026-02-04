"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@server/_generated/api";
import type { Id } from "convex/values";
import {
  type BoardState,
  type BattleLogEntry,
  type CellState,
  type Coordinate,
  type GamePhase,
  type GameUIState,
  type Guidance,
  type Ship,
  type TurnOwner,
  COLUMNS,
  ROWS,
  toCoordinate,
} from "../types";

// Demo ships for testing (will be replaced by backend data)
const DEMO_PLAYER_SHIPS: Ship[] = [
  {
    id: "carrier",
    name: "Carrier",
    size: 5,
    cells: ["G1", "G2", "G3", "G4", "G5"],
    sunk: false,
  },
  {
    id: "battleship",
    name: "Battleship",
    size: 4,
    cells: ["C5", "D5", "E5", "F5"],
    sunk: false,
  },
  {
    id: "cruiser",
    name: "Cruiser",
    size: 3,
    cells: ["I8", "I9", "I10"],
    sunk: false,
  },
];

// Demo hits/misses for testing
const DEMO_ENEMY_BOARD_CELLS = new Map<Coordinate, CellState>([
  ["B3", "miss"],
  ["D5", "hit"],
  ["D6", "hit"],
  ["D7", "hit"],
  ["E8", "miss"],
  ["F4", "hit"],
]);

const DEMO_PLAYER_BOARD_CELLS = new Map<Coordinate, CellState>([
  ["G2", "ship-hit"],
  ["G3", "ship-hit"],
  ["H7", "miss"],
]);

// Create initial empty board state
const createEmptyBoardState = (): BoardState => ({
  cells: new Map(),
  ships: [],
});

// Create demo board state for player
const createDemoPlayerBoardState = (): BoardState => {
  const cells = new Map<Coordinate, CellState>();

  // Add ship cells
  DEMO_PLAYER_SHIPS.forEach((ship) => {
    ship.cells.forEach((cell) => {
      cells.set(cell, "ship");
    });
  });

  // Apply hits/misses
  DEMO_PLAYER_BOARD_CELLS.forEach((state, coord) => {
    cells.set(coord, state);
  });

  return {
    cells,
    ships: DEMO_PLAYER_SHIPS,
  };
};

// Create demo board state for enemy
const createDemoEnemyBoardState = (): BoardState => ({
  cells: DEMO_ENEMY_BOARD_CELLS,
  ships: [], // Enemy ships are hidden
});

// Demo battle log entries
const DEMO_BATTLE_LOG: BattleLogEntry[] = [
  {
    id: "1",
    actor: "you",
    coordinate: "A7",
    result: "hit",
    timestamp: Date.now() - 60000,
  },
  {
    id: "2",
    actor: "enemy",
    coordinate: "A7",
    result: "hit",
    timestamp: Date.now() - 30000,
  },
];

interface UseGameStateOptions {
  gameId: string;
  deviceId: string | null;
}

interface UseGameStateResult {
  state: GameUIState | null;
  isLoading: boolean;
  fireAt: (coordinate: Coordinate) => void;
}

/**
 * Hook to manage game state from Convex subscriptions.
 * Currently uses demo data for UI development.
 */
export function useGameState({
  gameId,
  deviceId,
}: UseGameStateOptions): UseGameStateResult {
  const typedGameId = gameId as Id<"games">;

  // Convex queries
  const game = useQuery(api.games.getGame, { gameId: typedGameId });
  const events = useQuery(api.games.listGameEvents, {
    gameId: typedGameId,
    limit: 50,
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(572); // 09:32 demo

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Determine turn ownership based on game state
  const turn: TurnOwner = useMemo(() => {
    if (!game || !deviceId) return "you";
    return game.currentTurnDeviceId === deviceId ? "you" : "enemy";
  }, [game, deviceId]);

  // Map game status to phase
  const phase: GamePhase = useMemo(() => {
    if (!game) return "placement";
    if (game.status === "finished") return "finished";
    if (game.status === "battle") return "battle";
    return "placement";
  }, [game]);

  // Build UI state from Convex data + demo data
  const state: GameUIState | null = useMemo(() => {
    // Return demo state for now
    return {
      phase,
      turn,
      timeRemaining,
      enemyShipsRemaining: 2,
      playerShipsRemaining: 2,
      enemyBoard: createDemoEnemyBoardState(),
      playerBoard: createDemoPlayerBoardState(),
      battleLog: DEMO_BATTLE_LOG,
      guidance: {
        role: "STRATEGIST",
        instruction: "Fire on A7",
        coordinate: "A7",
      },
    };
  }, [phase, turn, timeRemaining]);

  // Fire at coordinate (mutation placeholder)
  const fireAt = useCallback((coordinate: Coordinate) => {
    console.log("Fire at:", coordinate);
    // TODO: Call Convex mutation to fire
  }, []);

  return {
    state,
    isLoading: !game,
    fireAt,
  };
}

export default useGameState;
