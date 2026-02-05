/**
 * Game constants
 */

// Timing constants
export const COUNTDOWN_DURATION_MS = 5000; // 5 seconds
export const PLACEMENT_DURATION_MS = 30000; // 30 seconds
export const TURN_DURATION_MS = 15000; // 15 seconds

// Bot timing - fires between 1-3 seconds into turn (avg ~2s)
export const BOT_MIN_DELAY_MS = 1000;
export const BOT_MAX_DELAY_MS = 3000;

// Board constants
export const BOARD_SIZE = 10;

// Bot player identifier for PvE mode
export const BOT_DEVICE_ID = "BOT";

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

// Maximum timeouts before auto-forfeit
export const MAX_TIMEOUTS = 3;
