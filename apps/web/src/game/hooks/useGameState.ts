"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@server/_generated/api";
import type { Id } from "@server/_generated/dataModel";
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
  timestamp: number;
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
  enemySunkShips: string[]; // Ship types sunk by player (e.g., ["destroyer", "submarine"])
  playerSunkShips: string[]; // Ship types sunk by enemy (e.g., ["carrier"])
  enemyCells: Map<Coordinate, EnemyCellState>;
  yourCells: Map<Coordinate, YourCellState>;
  battleLog: BattleLogEntry[];
  guidance: Guidance | null;
  enemyHoverCoord: Coordinate | null; // Enemy's hover position on your board (PvP only)
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

// Shot effect for visual feedback (plume effects)
export interface ShotEffect {
  id: string;
  board: "enemy" | "mine";
  coordinate: Coordinate;
  variant: "miss" | "hitEnemy" | "hitMe";
}

interface UseGameStateResult {
  state: GameUIState | null;
  isLoading: boolean;
  isFiring: boolean; // True while waiting for shot resolution
  lastOutcome: ShotOutcome | null; // Last shot result for feedback (my shot)
  lastEnemyShot: ShotOutcome | null; // Last enemy shot result for feedback
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
  const advanceTurnIfExpiredMutation = useMutation(api.games.advanceTurnIfExpired);

  // Timer state (in milliseconds)
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);

  // Firing state - tracks when we're waiting for shot resolution
  const [isFiring, setIsFiring] = useState(false);
  const [pendingShotCoord, setPendingShotCoord] = useState<Coordinate | null>(null);
  const [lastOutcome, setLastOutcome] = useState<ShotOutcome | null>(null);
  const [lastShotCount, setLastShotCount] = useState(0);

  // Enemy shot state - tracks when enemy fires at us
  const [lastEnemyShot, setLastEnemyShot] = useState<ShotOutcome | null>(null);
  const [lastEnemyShotCount, setLastEnemyShotCount] = useState(0);

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

  // Track shot count to detect when my shot resolves (shots on enemy board)
  const currentShotCount = useMemo(() => {
    if (!game || !opponentDeviceId) return 0;
    const opponentBoard = game.boards[opponentDeviceId];
    return opponentBoard?.shotsReceived?.length ?? 0;
  }, [game, opponentDeviceId]);

  // Track enemy shot count to detect when enemy shot resolves (shots on my board)
  const currentEnemyShotCount = useMemo(() => {
    if (!game || !deviceId) return 0;
    const myBoard = game.boards[deviceId];
    return myBoard?.shotsReceived?.length ?? 0;
  }, [game, deviceId]);

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

  // Detect enemy shot resolution - when enemy shot count increases
  useEffect(() => {
    // Skip if count didn't increase
    if (currentEnemyShotCount <= lastEnemyShotCount) return;

    // Get the last shot (the one enemy just fired)
    if (game && deviceId) {
      const myBoard = game.boards[deviceId];
      const shots = myBoard?.shotsReceived ?? [];
      const lastShot = shots[shots.length - 1];

      if (lastShot) {
        const outcome: ShotOutcome = {
          coordinate: coordToString(lastShot.coord),
          result: lastShot.result,
          shipName: lastShot.sunkShipType
            ? SHIP_NAMES[lastShot.sunkShipType]
            : undefined,
        };
        setLastEnemyShot(outcome);
      }
    }

    // Update tracked count
    setLastEnemyShotCount(currentEnemyShotCount);
  }, [currentEnemyShotCount, lastEnemyShotCount, game, deviceId]);

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

    // Build a set of ship cell coordinates
    const shipCellSet = new Set<string>();
    for (const ship of myBoard.ships) {
      const shipCells = getShipCells(ship);
      for (const cell of shipCells) {
        shipCellSet.add(`${cell.x},${cell.y}`);
      }
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

    // Process misses (shots that hit water, not ships)
    for (const shot of myBoard.shotsReceived) {
      const key = `${shot.coord.x},${shot.coord.y}`;
      if (shot.result === "miss" && !shipCellSet.has(key)) {
        const coord = coordToString(shot.coord);
        cells.set(coord, "miss");
      }
    }

    return cells;
  }, [game, deviceId]);

  // Calculate enemy ships remaining and track which are sunk
  const { enemyShipsRemaining, enemySunkShips } = useMemo(() => {
    if (!game || !opponentDeviceId) return { enemyShipsRemaining: 5, enemySunkShips: [] as string[] };

    const opponentBoard = game.boards[opponentDeviceId];
    if (!opponentBoard) return { enemyShipsRemaining: 5, enemySunkShips: [] as string[] };

    // Collect unique sunk ship types from our shots
    const sunkShipTypes: string[] = [];
    const seenTypes = new Set<string>();
    for (const shot of opponentBoard.shotsReceived) {
      if (shot.result === "sunk" && shot.sunkShipType && !seenTypes.has(shot.sunkShipType)) {
        seenTypes.add(shot.sunkShipType);
        sunkShipTypes.push(shot.sunkShipType);
      }
    }

    return {
      enemyShipsRemaining: 5 - sunkShipTypes.length,
      enemySunkShips: sunkShipTypes,
    };
  }, [game, opponentDeviceId]);

  // Calculate player ships remaining and track which are sunk
  const { playerShipsRemaining, playerSunkShips } = useMemo(() => {
    if (!game || !deviceId) return { playerShipsRemaining: 5, playerSunkShips: [] as string[] };

    const myBoard = game.boards[deviceId];
    if (!myBoard) return { playerShipsRemaining: 5, playerSunkShips: [] as string[] };

    // Track sunk ships from shots received on our board
    const sunkShipTypes: string[] = [];
    const seenTypes = new Set<string>();
    for (const shot of myBoard.shotsReceived) {
      if (shot.result === "sunk" && shot.sunkShipType && !seenTypes.has(shot.sunkShipType)) {
        seenTypes.add(shot.sunkShipType);
        sunkShipTypes.push(shot.sunkShipType);
      }
    }

    return {
      playerShipsRemaining: 5 - sunkShipTypes.length,
      playerSunkShips: sunkShipTypes,
    };
  }, [game, deviceId]);

  // Strategist threshold: show guidance when < 7 seconds remaining
  const STRATEGIST_THRESHOLD_MS = 7000;

  // Track if strategist is active (timer under threshold and our turn)
  const isStrategistActive =
    phase === "battle" &&
    turn === "you" &&
    !isFiring &&
    timeRemainingMs > 0 &&
    timeRemainingMs <= STRATEGIST_THRESHOLD_MS;

  // Cached strategist recommendation - only recalculate when needed
  const [cachedRecommendation, setCachedRecommendation] = useState<Coordinate | null>(null);
  const lastEnemyCellsCountRef = useRef(0);
  const wasStrategistActiveRef = useRef(false);

  // Update cached recommendation when entering strategist mode or board changes
  useEffect(() => {
    const currentCellsCount = enemyCells.size;

    // Recalculate if:
    // 1. Just entered strategist mode (wasn't active, now is)
    // 2. Board state changed (shot landed while in strategist mode)
    const justEnteredStrategist = isStrategistActive && !wasStrategistActiveRef.current;
    const boardChanged = currentCellsCount !== lastEnemyCellsCountRef.current;

    if (isStrategistActive && (justEnteredStrategist || boardChanged)) {
      setCachedRecommendation(getStrategistRecommendation(enemyCells));
    }

    // Clear cache when exiting strategist mode
    if (!isStrategistActive && wasStrategistActiveRef.current) {
      setCachedRecommendation(null);
    }

    wasStrategistActiveRef.current = isStrategistActive;
    lastEnemyCellsCountRef.current = currentCellsCount;
  }, [isStrategistActive, enemyCells]);

  // Build guidance from cached recommendation
  const guidance: Guidance | null = useMemo(() => {
    if (!isStrategistActive || !cachedRecommendation) {
      return null;
    }

    return {
      role: "STRATEGIST",
      instruction: formatStrategistInstruction(cachedRecommendation),
      coordinate: cachedRecommendation,
    };
  }, [isStrategistActive, cachedRecommendation]);

  // Track turns we've already called advanceTurnIfExpired for (prevent duplicate calls)
  const lastExpiredTurnRef = useRef<number | null>(null);

  // Call server to advance turn when timer expires
  // Server is the source of truth - it validates the turn actually expired
  // IMPORTANT: Either player's client can call this - not just the player whose turn it is
  // This ensures the game progresses even if one player disconnects
  useEffect(() => {
    // Only run during battle phase
    if (phase !== "battle") {
      return;
    }

    // Skip if no valid turn timestamp
    if (!game?.turnStartedAt || !game?.turnDurationMs) {
      return;
    }

    // Skip if we already called this for this turn
    if (lastExpiredTurnRef.current === game.turnStartedAt) {
      return;
    }

    // Check if timer expired using the state value
    // timeRemainingMs is clamped to 0, so this triggers when it reaches 0
    if (timeRemainingMs > 0) {
      return;
    }

    // Double-check with actual time calculation (handles edge cases)
    const actualEndTime = game.turnStartedAt + game.turnDurationMs;
    const actualRemaining = actualEndTime - Date.now();

    // Skip if timer hasn't actually expired (with 500ms tolerance for clock skew)
    if (actualRemaining > 500) {
      return;
    }

    console.log("Turn expired, calling advanceTurnIfExpired (current turn:", turn, ", timeRemainingMs:", timeRemainingMs, ")");
    lastExpiredTurnRef.current = game.turnStartedAt;

    // Let server handle the turn timeout
    advanceTurnIfExpiredMutation({ gameId: typedGameId }).catch((error) => {
      console.error("Failed to advance turn:", error);
    });
  }, [
    phase,
    turn,
    timeRemainingMs, // Primary trigger - when this hits 0
    game?.turnStartedAt,
    game?.turnDurationMs,
    advanceTurnIfExpiredMutation,
    typedGameId,
  ]);

  // Additional safety: Poll for expired turn every second during battle
  // This catches cases where the timer effect doesn't trigger properly
  useEffect(() => {
    if (phase !== "battle") {
      return;
    }

    const checkExpired = () => {
      if (!game?.turnStartedAt || !game?.turnDurationMs) {
        return;
      }

      // Skip if we already called this for this turn
      if (lastExpiredTurnRef.current === game.turnStartedAt) {
        return;
      }

      const actualEndTime = game.turnStartedAt + game.turnDurationMs;
      const actualRemaining = actualEndTime - Date.now();

      if (actualRemaining <= 0) {
        console.log("Poll detected expired turn, calling advanceTurnIfExpired");
        lastExpiredTurnRef.current = game.turnStartedAt;
        advanceTurnIfExpiredMutation({ gameId: typedGameId }).catch((error) => {
          console.error("Failed to advance turn (poll):", error);
        });
      }
    };

    // Check every second as a safety net
    const interval = setInterval(checkExpired, 1000);

    return () => clearInterval(interval);
  }, [phase, game?.turnStartedAt, game?.turnDurationMs, advanceTurnIfExpiredMutation, typedGameId]);

  // Derive enemy hover coordinate (for showing where enemy is hovering on your board)
  const enemyHoverCoord: Coordinate | null = useMemo(() => {
    if (!game?.enemyHoverCoord) return null;
    return coordToString(game.enemyHoverCoord);
  }, [game?.enemyHoverCoord]);

  // Build battle log from both boards' shots, sorted by timestamp
  const battleLog = useMemo(() => {
    const entries: BattleLogEntry[] = [];
    if (!game || !deviceId || !opponentDeviceId) return entries;

    const myBoard = game.boards[deviceId];
    const opponentBoard = game.boards[opponentDeviceId];

    // Add shots I fired (from opponent's shotsReceived)
    if (opponentBoard) {
      opponentBoard.shotsReceived.forEach((shot, index) => {
        entries.push({
          id: `you-${shot.timestamp}-${index}`,
          actor: "you",
          coordinate: coordToString(shot.coord),
          result: shot.result,
          shipName: shot.sunkShipType
            ? SHIP_NAMES[shot.sunkShipType]
            : undefined,
          timestamp: shot.timestamp,
        });
      });
    }

    // Add shots opponent fired (from my shotsReceived)
    if (myBoard) {
      myBoard.shotsReceived.forEach((shot, index) => {
        entries.push({
          id: `enemy-${shot.timestamp}-${index}`,
          actor: "enemy",
          coordinate: coordToString(shot.coord),
          result: shot.result,
          shipName: shot.sunkShipType
            ? SHIP_NAMES[shot.sunkShipType]
            : undefined,
          timestamp: shot.timestamp,
        });
      });
    }

    // Sort by timestamp ascending (oldest first, newest at bottom)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    return entries;
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
      enemySunkShips,
      playerSunkShips,
      enemyCells,
      yourCells,
      battleLog,
      guidance, // Strategist guidance when timer < 7 seconds
      enemyHoverCoord, // Enemy's hover position on your board (PvP only)
    };
  }, [
    game,
    phase,
    turn,
    timeRemainingMs,
    enemyShipsRemaining,
    playerShipsRemaining,
    enemySunkShips,
    playerSunkShips,
    enemyCells,
    yourCells,
    battleLog,
    guidance,
    enemyHoverCoord,
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
    lastEnemyShot,
    fireAt,
  };
}

export default useGameState;
