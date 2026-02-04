/**
 * Placement Resolver - Deterministic collision resolution for ship placement
 *
 * Core principles:
 * 1. The active ship's placement is always preserved
 * 2. Colliding ships are moved via BFS/spiral search
 * 3. Resolution is deterministic (same input = same output)
 * 4. Tie-breaking: smaller Manhattan distance, then smaller y, then smaller x
 */

import { BOARD_SIZE } from "../types";

// =============================================================================
// TYPES
// =============================================================================

export type ShipType =
  | "carrier"
  | "battleship"
  | "cruiser"
  | "submarine"
  | "destroyer";

export type Orientation = "horizontal" | "vertical";

export interface Ship {
  shipType: ShipType;
  origin: { x: number; y: number };
  orientation: Orientation;
  length: number;
}

export interface Coord {
  x: number;
  y: number;
}

// Cell key for occupancy map
type CellKey = string; // "x,y" format

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a cell key from coordinates
 */
function cellKey(x: number, y: number): CellKey {
  return `${x},${y}`;
}

/**
 * Get all cells occupied by a ship
 */
export function getShipCells(ship: Ship): Coord[] {
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

/**
 * Check if a ship is fully within bounds (0 to BOARD_SIZE-1)
 */
export function isInBounds(ship: Ship): boolean {
  const cells = getShipCells(ship);
  return cells.every(
    (c) => c.x >= 0 && c.x < BOARD_SIZE && c.y >= 0 && c.y < BOARD_SIZE
  );
}

/**
 * Clamp a ship to be within bounds
 * Shifts minimally to fit. Priority: right → left → down → up
 */
export function clampToBounds(ship: Ship): Ship {
  let { x, y } = ship.origin;
  const { length, orientation } = ship;

  if (orientation === "horizontal") {
    // Check x bounds (ship extends right)
    if (x < 0) x = 0;
    if (x + length > BOARD_SIZE) x = BOARD_SIZE - length;
    // Check y bounds
    if (y < 0) y = 0;
    if (y >= BOARD_SIZE) y = BOARD_SIZE - 1;
  } else {
    // Check y bounds (ship extends down)
    if (y < 0) y = 0;
    if (y + length > BOARD_SIZE) y = BOARD_SIZE - length;
    // Check x bounds
    if (x < 0) x = 0;
    if (x >= BOARD_SIZE) x = BOARD_SIZE - 1;
  }

  return { ...ship, origin: { x, y } };
}

/**
 * Build an occupancy map from ships
 * Returns a map of "x,y" -> shipType
 */
export function buildOccupancyMap(
  ships: Ship[],
  excludeShipType?: ShipType
): Map<CellKey, ShipType> {
  const map = new Map<CellKey, ShipType>();

  for (const ship of ships) {
    if (excludeShipType && ship.shipType === excludeShipType) continue;
    const cells = getShipCells(ship);
    for (const cell of cells) {
      map.set(cellKey(cell.x, cell.y), ship.shipType);
    }
  }

  return map;
}

/**
 * Check if a ship overlaps with any occupied cells
 */
function hasOverlap(ship: Ship, occupancy: Map<CellKey, ShipType>): boolean {
  const cells = getShipCells(ship);
  return cells.some((c) => occupancy.has(cellKey(c.x, c.y)));
}

/**
 * Find all ships that overlap with the given ship
 */
export function findOverlappingShips(ship: Ship, ships: Ship[]): ShipType[] {
  const occupancy = buildOccupancyMap(ships, ship.shipType);
  const cells = getShipCells(ship);
  const overlapping = new Set<ShipType>();

  for (const cell of cells) {
    const key = cellKey(cell.x, cell.y);
    if (occupancy.has(key)) {
      overlapping.add(occupancy.get(key)!);
    }
  }

  return Array.from(overlapping);
}

/**
 * Check if a position is valid for a ship (in bounds and no overlap)
 */
function isValidPosition(
  ship: Ship,
  origin: Coord,
  occupancy: Map<CellKey, ShipType>
): boolean {
  const testShip = { ...ship, origin };

  // Check bounds
  if (!isInBounds(testShip)) return false;

  // Check overlap
  const cells = getShipCells(testShip);
  for (const cell of cells) {
    if (occupancy.has(cellKey(cell.x, cell.y))) {
      return false;
    }
  }

  return true;
}

/**
 * Generate candidate positions ordered by Manhattan distance from origin
 * Tie-breaking: smaller y, then smaller x
 */
function generateCandidatePositions(origin: Coord): Coord[] {
  const candidates: Array<{ coord: Coord; distance: number }> = [];

  // Generate all valid board positions
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const distance = Math.abs(x - origin.x) + Math.abs(y - origin.y);
      candidates.push({ coord: { x, y }, distance });
    }
  }

  // Sort by: distance ASC, y ASC, x ASC (deterministic)
  candidates.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.coord.y !== b.coord.y) return a.coord.y - b.coord.y;
    return a.coord.x - b.coord.x;
  });

  return candidates.map((c) => c.coord);
}

/**
 * Find a valid position for a ship using BFS/spiral search
 * Preserves ship orientation
 */
export function findValidPosition(
  ship: Ship,
  occupancy: Map<CellKey, ShipType>
): Coord | null {
  const candidates = generateCandidatePositions(ship.origin);

  for (const candidate of candidates) {
    if (isValidPosition(ship, candidate, occupancy)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Mark cells as occupied in the map
 */
function markOccupied(
  occupancy: Map<CellKey, ShipType>,
  ship: Ship
): void {
  const cells = getShipCells(ship);
  for (const cell of cells) {
    occupancy.set(cellKey(cell.x, cell.y), ship.shipType);
  }
}

// =============================================================================
// MAIN ALGORITHM
// =============================================================================

/**
 * Resolve placement after an action (drag drop or rotate)
 *
 * Algorithm:
 * 1. Apply the active ship's new placement (already done in input)
 * 2. Build occupancy map with active ship
 * 3. Find all ships overlapping the active ship
 * 4. For each overlapping ship, find new valid position via BFS
 * 5. Update occupancy, cascade if needed
 * 6. Fallback to deterministic repack if stuck
 */
export function resolvePlacement(
  ships: Ship[],
  activeShipType: ShipType
): Ship[] {
  // Clone ships to avoid mutation
  const result = ships.map((s) => ({ ...s, origin: { ...s.origin } }));

  // Find the active ship
  const activeShip = result.find((s) => s.shipType === activeShipType);
  if (!activeShip) return result;

  // Build initial occupancy with only the active ship
  const occupancy = new Map<CellKey, ShipType>();
  markOccupied(occupancy, activeShip);

  // Queue of ships that need to be repositioned
  const toReposition: ShipType[] = [];

  // Find ships overlapping with the active ship
  for (const ship of result) {
    if (ship.shipType === activeShipType) continue;
    if (hasOverlap(ship, occupancy)) {
      toReposition.push(ship.shipType);
    }
  }

  // Track which ships have been resolved
  const resolved = new Set<ShipType>([activeShipType]);

  // Process queue
  while (toReposition.length > 0) {
    const shipType = toReposition.shift()!;

    // Skip if already resolved (shouldn't happen, but safety check)
    if (resolved.has(shipType)) continue;

    const ship = result.find((s) => s.shipType === shipType);
    if (!ship) continue;

    // Find new valid position
    const newPosition = findValidPosition(ship, occupancy);

    if (newPosition) {
      // Update ship position
      ship.origin = newPosition;

      // Mark as resolved and add to occupancy
      resolved.add(shipType);
      markOccupied(occupancy, ship);

      // Check if this caused new overlaps with unresolved ships
      for (const otherShip of result) {
        if (resolved.has(otherShip.shipType)) continue;
        if (toReposition.includes(otherShip.shipType)) continue;
        if (hasOverlap(otherShip, occupancy)) {
          toReposition.push(otherShip.shipType);
        }
      }
    } else {
      // No valid position found - use fallback
      return deterministicRepack(result, activeShipType);
    }
  }

  return result;
}

/**
 * Deterministic fallback: repack all ships if BFS fails
 * Keeps active ship fixed, places others in scan order
 */
function deterministicRepack(
  ships: Ship[],
  activeShipType: ShipType
): Ship[] {
  const result: Ship[] = [];
  const occupancy = new Map<CellKey, ShipType>();

  // Place active ship first (fixed position)
  const activeShip = ships.find((s) => s.shipType === activeShipType);
  if (activeShip) {
    result.push({ ...activeShip, origin: { ...activeShip.origin } });
    markOccupied(occupancy, activeShip);
  }

  // Sort other ships deterministically by shipType
  const sortedOthers = ships
    .filter((s) => s.shipType !== activeShipType)
    .sort((a, b) => a.shipType.localeCompare(b.shipType));

  // Place each ship in first valid position (top-left scan)
  for (const ship of sortedOthers) {
    const clonedShip = { ...ship, origin: { ...ship.origin } };
    const candidates = generateCandidatePositions({ x: 0, y: 0 });

    let placed = false;
    for (const candidate of candidates) {
      if (isValidPosition(clonedShip, candidate, occupancy)) {
        clonedShip.origin = candidate;
        result.push(clonedShip);
        markOccupied(occupancy, clonedShip);
        placed = true;
        break;
      }
    }

    // This should never happen with standard 5 ships on 10x10 board
    if (!placed) {
      console.error(`Failed to place ship: ${ship.shipType}`);
      result.push(clonedShip); // Add anyway to preserve ship count
    }
  }

  return result;
}

// =============================================================================
// ROTATION HELPER
// =============================================================================

/**
 * Rotate a ship and apply collision resolution
 * Anchor point is the origin (left for horizontal, top for vertical)
 */
export function rotateAndResolve(
  ships: Ship[],
  shipType: ShipType
): Ship[] {
  // Create new array with rotated ship
  const rotated = ships.map((ship) => {
    if (ship.shipType !== shipType) return ship;

    // Toggle orientation
    const newOrientation: Orientation =
      ship.orientation === "horizontal" ? "vertical" : "horizontal";

    // Create rotated ship (origin stays as anchor)
    let rotatedShip: Ship = {
      ...ship,
      orientation: newOrientation,
    };

    // Clamp to bounds after rotation
    rotatedShip = clampToBounds(rotatedShip);

    return rotatedShip;
  });

  // Resolve any collisions
  return resolvePlacement(rotated, shipType);
}

// =============================================================================
// DRAG HELPER
// =============================================================================

/**
 * Move a ship to a new position and resolve collisions
 * Position is clamped to bounds before resolution
 */
export function moveAndResolve(
  ships: Ship[],
  shipType: ShipType,
  newOrigin: Coord
): Ship[] {
  // Create new array with moved ship
  const moved = ships.map((ship) => {
    if (ship.shipType !== shipType) return ship;

    let movedShip: Ship = {
      ...ship,
      origin: { ...newOrigin },
    };

    // Clamp to bounds
    movedShip = clampToBounds(movedShip);

    return movedShip;
  });

  // Resolve any collisions
  return resolvePlacement(moved, shipType);
}

/**
 * Calculate clamped position during drag (for preview)
 * Does not resolve collisions, just shows where ship would land
 */
export function clampDragPosition(
  ship: Ship,
  newOrigin: Coord
): Coord {
  const testShip: Ship = { ...ship, origin: newOrigin };
  const clamped = clampToBounds(testShip);
  return clamped.origin;
}
