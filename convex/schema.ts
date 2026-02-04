import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Game status (finite state machine)
const status = v.union(
  v.literal("lobby"),
  v.literal("countdown"),
  v.literal("placement"),
  v.literal("battle"),
  v.literal("finished")
);

// Game mode
const mode = v.union(v.literal("pvp"), v.literal("pve"));

// Player in a game
const player = v.object({
  deviceId: v.string(),
  ready: v.boolean(),
  joinedAt: v.number(),
  lastSeenAt: v.number()
});

// Ship types with their lengths
// carrier: 5, battleship: 4, cruiser: 3, submarine: 3, destroyer: 2
const shipType = v.union(
  v.literal("carrier"),
  v.literal("battleship"),
  v.literal("cruiser"),
  v.literal("submarine"),
  v.literal("destroyer")
);

// Ship placement on a board
const ship = v.object({
  shipType,
  origin: v.object({ x: v.number(), y: v.number() }),
  orientation: v.union(v.literal("horizontal"), v.literal("vertical")),
  length: v.number()
});

// Shot result
const shotResult = v.union(
  v.literal("miss"),
  v.literal("hit"),
  v.literal("sunk")
);

// Shot record
const shot = v.object({
  coord: v.object({ x: v.number(), y: v.number() }),
  result: shotResult,
  sunkShipType: v.optional(shipType)
});

// Player's board state
const board = v.object({
  ships: v.array(ship),
  shotsReceived: v.array(shot)
});

export default defineSchema({
  games: defineTable({
    // Core fields
    mode,
    status,
    hostDeviceId: v.string(),
    players: v.array(player),

    // Boards - keyed by deviceId, REQUIRED (not optional)
    boards: v.record(v.string(), board),

    // Timing fields (timestamps + durations)
    countdownStartedAt: v.optional(v.number()),
    countdownDurationMs: v.optional(v.number()),
    placementStartedAt: v.optional(v.number()),
    placementDurationMs: v.optional(v.number()),
    turnStartedAt: v.optional(v.number()),
    turnDurationMs: v.optional(v.number()),

    // Turn and winner tracking
    currentTurnDeviceId: v.optional(v.string()),
    winnerDeviceId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number()
  }),

  gameEvents: defineTable({
    gameId: v.id("games"),
    seq: v.number(),
    actorDeviceId: v.optional(v.string()), // Optional for system events
    type: v.string(),
    payload: v.any(),
    createdAt: v.number()
  }).index("by_gameId_seq", ["gameId", "seq"])
});
