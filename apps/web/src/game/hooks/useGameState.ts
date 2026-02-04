"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@server/_generated/api";
import type { Id } from "convex/values";
import {
  type BattleLogEntry,
  type Coordinate,
  type EnemyCellState,
  type GamePhase,
  type Guidance,
  type TurnOwner,
  type YourCellState,
} from "../types";

// Demo enemy board cells
const DEMO_ENEMY_CELLS = new Map<Coordinate, EnemyCellState>([
  ["C3", "miss"],
  ["G7", "hit"],
  ["I7", "hit"],
  ["I8", "hit"],
  ["B8", "sunk"],
  ["C8", "sunk"],
  ["D8", "sunk"],
]);

// Demo player board cells with ship parts
const DEMO_YOUR_CELLS = new Map<Coordinate, YourCellState>([
  // Vertical ship (safe) - column H, rows 2-5
  ["H2", "ship-safe-top"],
  ["H3", "ship-hit-body"],
  ["H4", "ship-hit-body"],
  ["H5", "ship-hit-bottom"],
  // Horizontal ship (safe) - row 5, columns B-D
  ["B5", "ship-safe-left"],
  ["C5", "ship-safe-body"],
  ["D5", "ship-safe-right"],
  // Horizontal ship (sunk) - row 9, columns E-F
  ["E9", "ship-sunk-left"],
  ["F9", "ship-sunk-right"],
]);

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

// Full game UI state
interface GameUIState {
  phase: GamePhase;
  turn: TurnOwner;
  timeRemaining: number;
  enemyShipsRemaining: number;
  playerShipsRemaining: number;
  enemyCells: Map<Coordinate, EnemyCellState>;
  yourCells: Map<Coordinate, YourCellState>;
  battleLog: BattleLogEntry[];
  guidance: Guidance | null;
}

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
    return {
      phase,
      turn,
      timeRemaining,
      enemyShipsRemaining: 2,
      playerShipsRemaining: 2,
      enemyCells: DEMO_ENEMY_CELLS,
      yourCells: DEMO_YOUR_CELLS,
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
