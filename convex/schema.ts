import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const status = v.union(
  v.literal("lobby"),
  v.literal("countdown"),
  v.literal("placement"),
  v.literal("battle"),
  v.literal("finished")
);

const player = v.object({
  deviceId: v.string(),
  side: v.union(v.literal("you"), v.literal("enemy")),
  ready: v.boolean(),
  joinedAt: v.number(),
  lastSeenAt: v.number()
});

export default defineSchema({
  games: defineTable({
    status,
    hostDeviceId: v.string(),
    players: v.array(player),
    countdownStartAt: v.optional(v.number()),
    currentTurnDeviceId: v.optional(v.string()),
    winnerDeviceId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }),
  gameEvents: defineTable({
    gameId: v.id("games"),
    seq: v.number(),
    actorDeviceId: v.string(),
    type: v.string(),
    payload: v.any(),
    createdAt: v.number()
  }).index("by_gameId_seq", ["gameId", "seq"])
});
