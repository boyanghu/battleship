/**
 * Game constants
 */

// Timing constants
export const COUNTDOWN_DURATION_MS = 5000; // 5 seconds
export const PLACEMENT_DURATION_MS = 30000; // 30 seconds
export const TURN_DURATION_MS = 15000; // 15 seconds

// Board constants
export const BOARD_SIZE = 10;

// Ship lengths by type - MUST match during placement validation
export const SHIP_LENGTHS: Record<string, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2
};

// Required ships for a valid placement
export const REQUIRED_SHIPS = [
  "carrier",
  "battleship",
  "cruiser",
  "submarine",
  "destroyer"
];
