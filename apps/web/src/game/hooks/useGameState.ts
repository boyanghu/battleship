"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
  parseCoordinate,
} from "../types";

// Ship type names for display
const SHIP_NAMES: Record<string, string> = {
  carrier: "Carrier",
  battleship: "Battleship",
  cruiser: "Cruiser",
  submarine: "Submarine",
  destroyer: "Destroyer",
};

// Ship lengths for calculating if a ship is sunk
const SHIP_LENGTHS: Record<string, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

// Types matching the backend schema
interface Coord {
  x: number;
  y: number;
}

interface Shot {
  coord: Coord;
  result: "miss" | "hit" | "sunk";
  sunkShipType?: string;
}

interface Ship {
  shipType: string;
  origin: Coord;
  orientation: "horizontal" | "vertical";
  length: number;
}

interface Board {
  ships: Ship[];
  shotsReceived: Shot[];
}

// Full game UI state
interface GameUIState {
  phase: GamePhase;
  turn: TurnOwner;
  timeRemainingMs: number;
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

// Helper to convert x,y coordinates to string coordinate (e.g., "A1")
function coordToString(coord: Coord): Coordinate {
  const col = String.fromCharCode(65 + coord.x); // 0 -> 'A', 1 -> 'B', etc.
  const row = coord.y + 1; // 0-indexed to 1-indexed
  return `${col}${row}`;
}

// Helper to get all cells occupied by a ship
function getShipCells(ship: Ship): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < ship.length; i++) {
    if (ship.orientation === "horizontal") {
      cells.push({ x: ship.origin.x + i, y: ship.origin.y });
    } else {
      cells.push({ x: ship.origin.x, y: ship.origin.y + i });
    }
  }
  return cells;
}

// Helper to determine cell position in ship
function getCellPosition(
  ship: Ship,
  cellIndex: number
): "left" | "right" | "top" | "bottom" | "body" {
  const isFirst = cellIndex === 0;
  const isLast = cellIndex === ship.length - 1;

  if (ship.orientation === "horizontal") {
    if (isFirst) return "left";
    if (isLast) return "right";
    return "body";
  } else {
    if (isFirst) return "top";
    if (isLast) return "bottom";
    return "body";
  }
}

// Helper to check if a ship is sunk based on shots received
function isShipSunk(ship: Ship, shotsReceived: Shot[]): boolean {
  const shipCells = getShipCells(ship);
  const hitCoords = new Set(
    shotsReceived
      .filter((s) => s.result === "hit" || s.result === "sunk")
      .map((s) => `${s.coord.x},${s.coord.y}`)
  );

  return shipCells.every((cell) => hitCoords.has(`${cell.x},${cell.y}`));
}

/**
 * Hook to manage game state from Convex subscriptions.
 * Connects battle phase UI to real backend data.
 */
export function useGameState({
  gameId,
  deviceId,
}: UseGameStateOptions): UseGameStateResult {
  const typedGameId = gameId as Id<"games">;

  // Convex queries (skip until deviceId is available)
  const game = useQuery(
    api.games.getGame,
    deviceId ? { gameId: typedGameId, deviceId } : "skip"
  );

  // Convex mutations
  const fireShotMutation = useMutation(api.games.fireShot);

  // Timer state (in milliseconds)
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);

  // Countdown timer effect - updates every 100ms for smooth display
  useEffect(() => {
    if (!game?.turnStartedAt || !game?.turnDurationMs) {
      setTimeRemainingMs(0);
      return;
    }

    const updateTimer = () => {
      const endTime = game.turnStartedAt! + game.turnDurationMs!;
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemainingMs(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [game?.turnStartedAt, game?.turnDurationMs]);

  // Get opponent's deviceId
  const opponentDeviceId = useMemo(() => {
    if (!game || !deviceId) return null;
    return game.players.find((p) => p.deviceId !== deviceId)?.deviceId ?? null;
  }, [game, deviceId]);

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

  // Build enemyCells from opponent's shotsReceived (shots we fired at them)
  const enemyCells = useMemo(() => {
    const cells = new Map<Coordinate, EnemyCellState>();
    if (!game || !opponentDeviceId) return cells;

    const opponentBoard = game.boards[opponentDeviceId];
    if (!opponentBoard) return cells;

    // shotsReceived on opponent's board = shots WE fired at them
    for (const shot of opponentBoard.shotsReceived) {
      const coord = coordToString(shot.coord);
      cells.set(coord, shot.result as EnemyCellState);
    }

    return cells;
  }, [game, opponentDeviceId]);

  // Build yourCells from your ships + shotsReceived (shots opponent fired at you)
  const yourCells = useMemo(() => {
    const cells = new Map<Coordinate, YourCellState>();
    if (!game || !deviceId) return cells;

    const myBoard = game.boards[deviceId];
    if (!myBoard) return cells;

    // Build a map of hit coordinates
    const hitCoords = new Map<string, Shot>();
    for (const shot of myBoard.shotsReceived) {
      hitCoords.set(`${shot.coord.x},${shot.coord.y}`, shot);
    }

    // Process each ship
    for (const ship of myBoard.ships) {
      const shipCells = getShipCells(ship);
      const shipIsSunk = isShipSunk(ship, myBoard.shotsReceived);

      shipCells.forEach((cell, index) => {
        const coord = coordToString(cell);
        const position = getCellPosition(ship, index);
        const hit = hitCoords.get(`${cell.x},${cell.y}`);

        let state: YourCellState;
        if (shipIsSunk) {
          state = `ship-sunk-${position}` as YourCellState;
        } else if (hit) {
          state = `ship-hit-${position}` as YourCellState;
        } else {
          state = `ship-safe-${position}` as YourCellState;
        }

        cells.set(coord, state);
      });
    }

    return cells;
  }, [game, deviceId]);

  // Calculate enemy ships remaining (based on sunk ship types we know about)
  const enemyShipsRemaining = useMemo(() => {
    if (!game || !opponentDeviceId) return 5;

    const opponentBoard = game.boards[opponentDeviceId];
    if (!opponentBoard) return 5;

    // Count unique sunk ship types from our shots
    const sunkShipTypes = new Set<string>();
    for (const shot of opponentBoard.shotsReceived) {
      if (shot.result === "sunk" && shot.sunkShipType) {
        sunkShipTypes.add(shot.sunkShipType);
      }
    }

    return 5 - sunkShipTypes.size;
  }, [game, opponentDeviceId]);

  // Calculate player ships remaining
  const playerShipsRemaining = useMemo(() => {
    if (!game || !deviceId) return 5;

    const myBoard = game.boards[deviceId];
    if (!myBoard) return 5;

    // Count ships that aren't sunk
    let remaining = 0;
    for (const ship of myBoard.ships) {
      if (!isShipSunk(ship, myBoard.shotsReceived)) {
        remaining++;
      }
    }

    return remaining;
  }, [game, deviceId]);

  // Build battle log from both boards' shots
  const battleLog = useMemo(() => {
    const entries: BattleLogEntry[] = [];
    if (!game || !deviceId || !opponentDeviceId) return entries;

    const myBoard = game.boards[deviceId];
    const opponentBoard = game.boards[opponentDeviceId];

    // Add shots I fired (from opponent's shotsReceived)
    if (opponentBoard) {
      opponentBoard.shotsReceived.forEach((shot, index) => {
        entries.push({
          id: `you-${index}`,
          actor: "you",
          coordinate: coordToString(shot.coord),
          result: shot.result,
          shipName: shot.sunkShipType
            ? SHIP_NAMES[shot.sunkShipType]
            : undefined,
          timestamp: 0, // We don't have timestamps in shots, use index for ordering
        });
      });
    }

    // Add shots opponent fired (from my shotsReceived)
    if (myBoard) {
      myBoard.shotsReceived.forEach((shot, index) => {
        entries.push({
          id: `enemy-${index}`,
          actor: "enemy",
          coordinate: coordToString(shot.coord),
          result: shot.result,
          shipName: shot.sunkShipType
            ? SHIP_NAMES[shot.sunkShipType]
            : undefined,
          timestamp: 1, // Slightly higher to interleave (crude ordering)
        });
      });
    }

    // Sort by id to maintain some order (you-0, enemy-0, you-1, enemy-1, etc.)
    // This is approximate since we don't have real timestamps
    return entries.slice(-10); // Show last 10 entries
  }, [game, deviceId, opponentDeviceId]);

  // Build UI state from real data
  const state: GameUIState | null = useMemo(() => {
    if (!game) return null;

    return {
      phase,
      turn,
      timeRemainingMs,
      enemyShipsRemaining,
      playerShipsRemaining,
      enemyCells,
      yourCells,
      battleLog,
      guidance: null, // No AI guidance for now
    };
  }, [
    game,
    phase,
    turn,
    timeRemainingMs,
    enemyShipsRemaining,
    playerShipsRemaining,
    enemyCells,
    yourCells,
    battleLog,
  ]);

  // Fire at coordinate (real mutation)
  const fireAt = useCallback(
    async (coordinate: Coordinate) => {
      if (!deviceId || turn !== "you") {
        console.warn("Cannot fire: not your turn or no deviceId");
        return;
      }

      const { col, row } = parseCoordinate(coordinate);
      const x = col.charCodeAt(0) - 65; // A=0, B=1, etc.
      const y = row - 1; // 1-indexed to 0-indexed

      try {
        await fireShotMutation({
          gameId: typedGameId,
          deviceId,
          coord: { x, y },
        });
      } catch (error) {
        console.error("Failed to fire shot:", error);
      }
    },
    [deviceId, turn, fireShotMutation, typedGameId]
  );

  return {
    state,
    isLoading: game === undefined,
    fireAt,
  };
}

export default useGameState;
