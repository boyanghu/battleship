"use client";

/**
 * Game-related type definitions
 */

// Cell coordinate (e.g., "A7", "J10")
export type Coordinate = string;

// Enemy cell states (from Figma)
export type EnemyCellState =
  | "neutral"
  | "hover"
  | "miss"
  | "hit"
  | "sunk";

// Your cell states - ship parts with rounded ends (from Figma)
// Rotate variants (-rotate suffix) show a rotate button for placement phase
export type YourCellState =
  | "neutral"
  | "ship-safe-left"
  | "ship-safe-right"
  | "ship-safe-top"
  | "ship-safe-bottom"
  | "ship-safe-body"
  | "ship-safe-left-rotate" // Horizontal ship head with rotate button
  | "ship-safe-top-rotate" // Vertical ship head with rotate button
  | "ship-hit-left"
  | "ship-hit-right"
  | "ship-hit-top"
  | "ship-hit-bottom"
  | "ship-hit-body"
  | "ship-sunk-left"
  | "ship-sunk-right"
  | "ship-sunk-top"
  | "ship-sunk-bottom"
  | "ship-sunk-body";

// Legacy cell state (for compatibility)
export type CellState = "empty" | "miss" | "hit" | "ship" | "ship-hit";

// Board side identifier
export type BoardSide = "enemy" | "player";

// Game phase
export type GamePhase = "placement" | "battle" | "finished";

// Turn ownership
export type TurnOwner = "you" | "enemy";

// Battle log entry
export interface BattleLogEntry {
  id: string;
  actor: "you" | "enemy";
  coordinate: Coordinate;
  result: "hit" | "miss" | "sunk";
  shipName?: string; // Only if sunk
  timestamp: number;
}

// Ship definition
export interface Ship {
  id: string;
  name: string;
  size: number;
  cells: Coordinate[];
  sunk: boolean;
}

// Board state
export interface BoardState {
  cells: Map<Coordinate, CellState>;
  ships: Ship[];
}

// Game guidance recommendation
export interface Guidance {
  role: string;
  instruction: string;
  coordinate: Coordinate;
}

// Full game state for the UI
export interface GameUIState {
  phase: GamePhase;
  turn: TurnOwner;
  timeRemaining: number; // seconds
  enemyShipsRemaining: number;
  playerShipsRemaining: number;
  enemyBoard: BoardState;
  playerBoard: BoardState;
  battleLog: BattleLogEntry[];
  guidance: Guidance | null;
}

// Board constants
export const BOARD_SIZE = 10;
export const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Helper to create coordinate string
export const toCoordinate = (col: string, row: number): Coordinate =>
  `${col}${row}`;

// Helper to parse coordinate string
export const parseCoordinate = (
  coord: Coordinate
): { col: string; row: number } => {
  const col = coord.charAt(0);
  const row = parseInt(coord.slice(1), 10);
  return { col, row };
};
