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
import {
  getStrategistRecommendation,
  formatStrategistInstruction,
} from "../utils";

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

// Shot outcome for feedback
export interface ShotOutcome {
  coordinate: Coordinate;
  result: "miss" | "hit" | "sunk";
  shipName?: string;
}

interface UseGameStateResult {
  state: GameUIState | null;
  isLoading: boolean;
  isFiring: boolean; // True while waiting for shot resolution
  lastOutcome: ShotOutcome | null; // Last shot result for feedback
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

  // Firing state - tracks when we're waiting for shot resolution
  const [isFiring, setIsFiring] = useState(false);
  const [pendingShotCoord, setPendingShotCoord] = useState<Coordinate | null>(null);
  const [lastOutcome, setLastOutcome] = useState<ShotOutcome | null>(null);
  const [lastShotCount, setLastShotCount] = useState(0);

  // Get opponent's deviceId (defined early for use in effects below)
  const opponentDeviceId = useMemo(() => {
    if (!game || !deviceId) return null;
    return game.players.find((p) => p.deviceId !== deviceId)?.deviceId ?? null;
  }, [game, deviceId]);

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

  // Track shot count to detect when shot resolves
  const currentShotCount = useMemo(() => {
    if (!game || !opponentDeviceId) return 0;
    const opponentBoard = game.boards[opponentDeviceId];
    return opponentBoard?.shotsReceived?.length ?? 0;
  }, [game, opponentDeviceId]);

  // Stub for audio/visual feedback - call this when shot resolves
  const onShotResolved = useCallback((outcome: ShotOutcome) => {
    // TODO: Trigger visual feedback (screen flash, cell animation)
    // TODO: Trigger audio feedback (hit sound, miss sound, sunk sound)
    console.log("Shot resolved:", outcome);
  }, []);

  // Detect shot resolution - when shot count increases while firing
  useEffect(() => {
    if (!isFiring || !pendingShotCoord) return;

    // Shot resolved when count increases
    if (currentShotCount > lastShotCount) {
      // Get the last shot (the one we just fired)
      if (game && opponentDeviceId) {
        const opponentBoard = game.boards[opponentDeviceId];
        const shots = opponentBoard?.shotsReceived ?? [];
        const lastShot = shots[shots.length - 1];

        if (lastShot) {
          const outcome: ShotOutcome = {
            coordinate: coordToString(lastShot.coord),
            result: lastShot.result,
            shipName: lastShot.sunkShipType
              ? SHIP_NAMES[lastShot.sunkShipType]
              : undefined,
          };
          setLastOutcome(outcome);

          // Trigger audio/visual feedback hooks
          onShotResolved(outcome);
        }
      }

      // Clear firing state
      setIsFiring(false);
      setPendingShotCoord(null);
      setLastShotCount(currentShotCount);
    }
  }, [currentShotCount, isFiring, pendingShotCoord, lastShotCount, game, opponentDeviceId, onShotResolved]);

  // Update lastShotCount when not firing (sync with server state)
  useEffect(() => {
    if (!isFiring) {
      setLastShotCount(currentShotCount);
    }
  }, [currentShotCount, isFiring]);

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

  // Strategist threshold: show guidance when < 7 seconds remaining
  const STRATEGIST_THRESHOLD_MS = 7000;

  // Calculate strategist guidance when timer is low and it's our turn
  const guidance: Guidance | null = useMemo(() => {
    // Only show guidance during battle phase, on our turn, when timer is low
    if (phase !== "battle" || turn !== "you" || isFiring) {
      return null;
    }

    // Only activate when under threshold
    if (timeRemainingMs > STRATEGIST_THRESHOLD_MS || timeRemainingMs <= 0) {
      return null;
    }

    // Get recommendation from strategist algorithm
    const recommendedCoord = getStrategistRecommendation(enemyCells);
    if (!recommendedCoord) {
      return null;
    }

    return {
      role: "STRATEGIST",
      instruction: formatStrategistInstruction(recommendedCoord),
      coordinate: recommendedCoord,
    };
  }, [phase, turn, isFiring, timeRemainingMs, enemyCells]);

  // Track if we've already auto-fired for this turn (prevent double-fire)
  const [hasAutoFired, setHasAutoFired] = useState(false);

  // Reset auto-fire flag when turn changes
  useEffect(() => {
    setHasAutoFired(false);
  }, [game?.currentTurnDeviceId]);

  // Auto-fire when timer hits 0 and it's our turn
  useEffect(() => {
    // Only auto-fire if:
    // - Battle phase
    // - Our turn
    // - Not already firing
    // - Haven't auto-fired this turn
    // - Timer just hit 0
    if (
      phase !== "battle" ||
      turn !== "you" ||
      isFiring ||
      hasAutoFired ||
      timeRemainingMs > 0
    ) {
      return;
    }

    // Get a target coordinate
    const targetCoord = getStrategistRecommendation(enemyCells);
    if (!targetCoord) {
      return;
    }

    console.log("Auto-firing at:", targetCoord);
    setHasAutoFired(true);

    // Fire at the recommended coordinate
    const { col, row } = parseCoordinate(targetCoord);
    const x = col.charCodeAt(0) - 65;
    const y = row - 1;

    fireShotMutation({
      gameId: typedGameId,
      deviceId: deviceId!,
      coord: { x, y },
    }).catch((error) => {
      console.error("Auto-fire failed:", error);
    });
  }, [
    phase,
    turn,
    isFiring,
    hasAutoFired,
    timeRemainingMs,
    enemyCells,
    fireShotMutation,
    typedGameId,
    deviceId,
  ]);

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
      guidance, // Strategist guidance when timer < 7 seconds
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
    guidance,
  ]);

  // Fire at coordinate (real mutation with input locking)
  const fireAt = useCallback(
    async (coordinate: Coordinate) => {
      // Prevent firing if already firing, not our turn, or no deviceId
      if (isFiring) {
        console.warn("Cannot fire: already firing");
        return;
      }
      if (!deviceId || turn !== "you") {
        console.warn("Cannot fire: not your turn or no deviceId");
        return;
      }

      const { col, row } = parseCoordinate(coordinate);
      const x = col.charCodeAt(0) - 65; // A=0, B=1, etc.
      const y = row - 1; // 1-indexed to 0-indexed

      // Lock input until shot resolves
      setIsFiring(true);
      setPendingShotCoord(coordinate);
      setLastOutcome(null); // Clear previous outcome

      try {
        await fireShotMutation({
          gameId: typedGameId,
          deviceId,
          coord: { x, y },
        });
        // Note: isFiring will be cleared when shot count increases (in effect above)
      } catch (error) {
        console.error("Failed to fire shot:", error);
        // Unlock on error
        setIsFiring(false);
        setPendingShotCoord(null);
      }
    },
    [isFiring, deviceId, turn, fireShotMutation, typedGameId]
  );

  return {
    state,
    isLoading: game === undefined,
    isFiring,
    lastOutcome,
    fireAt,
  };
}

export default useGameState;
