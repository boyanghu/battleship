/**
 * Coordinate Utilities - Conversion between string coordinates and numeric pairs.
 *
 * String coordinates: "A1" - "J10" (column letter + row number)
 * Numeric coordinates: { x: 0-9, y: 0-9 } (0-indexed)
 *
 * Time Complexity: All operations are O(1)
 */

import { type Coordinate, BOARD_SIZE, COLUMNS } from "../types";

/** Numeric coordinate pair (0-indexed) */
export interface Coord {
  x: number; // 0-9, corresponds to columns A-J
  y: number; // 0-9, corresponds to rows 1-10
}

/**
 * Convert numeric coordinates to string coordinate.
 * O(1) - constant time string concatenation
 *
 * @example coordToString({ x: 0, y: 0 }) => "A1"
 * @example coordToString({ x: 9, y: 9 }) => "J10"
 */
export function coordToString(coord: Coord): Coordinate {
  const col = String.fromCharCode(65 + coord.x); // 0 -> 'A', 1 -> 'B', etc.
  const row = coord.y + 1; // 0-indexed to 1-indexed
  return `${col}${row}`;
}

/**
 * Alternative: Convert x, y values directly to string coordinate.
 * O(1) - constant time string concatenation
 *
 * @example xyToString(0, 0) => "A1"
 * @example xyToString(9, 9) => "J10"
 */
export function xyToString(x: number, y: number): Coordinate {
  return `${COLUMNS[x]}${y + 1}`;
}

/**
 * Parse string coordinate to numeric coordinates.
 * O(1) - constant time parsing
 *
 * @example stringToCoord("A1") => { x: 0, y: 0 }
 * @example stringToCoord("J10") => { x: 9, y: 9 }
 */
export function stringToCoord(coord: Coordinate): Coord {
  const col = coord.charAt(0);
  const row = parseInt(coord.slice(1), 10);
  return {
    x: col.charCodeAt(0) - 65, // A=0, B=1, etc.
    y: row - 1, // 1-indexed to 0-indexed
  };
}

/**
 * Parse string coordinate to column letter and row number.
 * O(1) - constant time parsing
 *
 * @example parseCoordinate("A1") => { col: "A", row: 1 }
 * @example parseCoordinate("J10") => { col: "J", row: 10 }
 */
export function parseCoordinate(
  coord: Coordinate
): { col: string; row: number } {
  const col = coord.charAt(0);
  const row = parseInt(coord.slice(1), 10);
  return { col, row };
}

/**
 * Create coordinate string from column letter and row number.
 * O(1) - constant time string concatenation
 *
 * @example toCoordinate("A", 1) => "A1"
 */
export function toCoordinate(col: string, row: number): Coordinate {
  return `${col}${row}`;
}

/**
 * Check if numeric coordinates are within board bounds.
 * O(1) - constant time bounds check
 */
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

/**
 * Check if a Coord is within board bounds.
 * O(1) - constant time bounds check
 */
export function isCoordInBounds(coord: Coord): boolean {
  return isInBounds(coord.x, coord.y);
}

/**
 * Create a cell key from coordinates (for use in Maps/Sets).
 * O(1) - constant time string concatenation
 *
 * @example cellKey(0, 0) => "0,0"
 */
export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Parse a cell key back to coordinates.
 * O(1) - constant time parsing
 *
 * @example parseCellKey("0,0") => { x: 0, y: 0 }
 */
export function parseCellKey(key: string): Coord {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}
