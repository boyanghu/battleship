import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const now = () => Date.now();

async function getNextSeq(ctx: { db: any }, gameId: string) {
  const last = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_seq", (q: any) => q.eq("gameId", gameId))
    .order("desc")
    .first();
  return last ? last.seq + 1 : 1;
}

async function appendEventInternal(
  ctx: { db: any },
  gameId: string,
  actorDeviceId: string,
  type: string,
  payload: unknown
) {
  const seq = await getNextSeq(ctx, gameId);
  await ctx.db.insert("gameEvents", {
    gameId,
    seq,
    actorDeviceId,
    type,
    payload,
    createdAt: now()
  });
  return seq;
}

export const createGame = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const timestamp = now();
    const gameId = await ctx.db.insert("games", {
      status: "lobby",
      hostDeviceId: args.deviceId,
      players: [
        {
          deviceId: args.deviceId,
          side: "you",
          ready: false,
          joinedAt: timestamp,
          lastSeenAt: timestamp
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    });

    await appendEventInternal(ctx, gameId, args.deviceId, "GAME_CREATED", {
      hostDeviceId: args.deviceId
    });

    return { gameId };
  }
});

export const joinGame = mutation({
  args: { gameId: v.id("games"), deviceId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const timestamp = now();
    const players = [...game.players];
    const existingIndex = players.findIndex(
      (player) => player.deviceId === args.deviceId
    );

    if (existingIndex >= 0) {
      players[existingIndex] = {
        ...players[existingIndex],
        lastSeenAt: timestamp
      };
    } else {
      if (players.length >= 2) {
        return { ok: false };
      }
      players.push({
        deviceId: args.deviceId,
        side: "enemy",
        ready: false,
        joinedAt: timestamp,
        lastSeenAt: timestamp
      });
      await appendEventInternal(ctx, args.gameId, args.deviceId, "PLAYER_JOINED", {
        deviceId: args.deviceId
      });
    }

    await ctx.db.patch(args.gameId, {
      players,
      updatedAt: timestamp
    });

    return { ok: true };
  }
});

export const setReady = mutation({
  args: {
    gameId: v.id("games"),
    deviceId: v.string(),
    ready: v.boolean()
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const timestamp = now();
    const players = game.players.map((player) =>
      player.deviceId === args.deviceId
        ? { ...player, ready: args.ready, lastSeenAt: timestamp }
        : player
    );

    await ctx.db.patch(args.gameId, {
      players,
      updatedAt: timestamp
    });

    await appendEventInternal(ctx, args.gameId, args.deviceId, "READY_SET", {
      ready: args.ready
    });

    return { ok: true };
  }
});

export const startCountdownIfReady = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "lobby") {
      return { countdownStartAt: game.countdownStartAt ?? null };
    }

    const allReady =
      game.players.length >= 2 && game.players.every((player) => player.ready);

    if (!allReady) {
      return { countdownStartAt: null };
    }

    const timestamp = now();
    await ctx.db.patch(args.gameId, {
      status: "countdown",
      countdownStartAt: timestamp,
      updatedAt: timestamp
    });

    await appendEventInternal(ctx, args.gameId, game.hostDeviceId, "COUNTDOWN_STARTED", {
      countdownStartAt: timestamp
    });

    return { countdownStartAt: timestamp };
  }
});

export const advanceToPlacement = mutation({
  args: { gameId: v.id("games"), deviceId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "countdown") {
      return { ok: true };
    }

    const timestamp = now();
    await ctx.db.patch(args.gameId, {
      status: "placement",
      updatedAt: timestamp
    });

    await appendEventInternal(
      ctx,
      args.gameId,
      args.deviceId,
      "PLACEMENT_STARTED",
      {}
    );

    return { ok: true };
  }
});

export const appendEvent = mutation({
  args: {
    gameId: v.id("games"),
    type: v.string(),
    payload: v.any(),
    actorDeviceId: v.string()
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const seq = await appendEventInternal(
      ctx,
      args.gameId,
      args.actorDeviceId,
      args.type,
      args.payload
    );

    await ctx.db.patch(args.gameId, { updatedAt: now() });

    return { seq };
  }
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  }
});

export const listGameEvents = query({
  args: {
    gameId: v.id("games"),
    limit: v.number(),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const paginationOpts = {
      numItems: args.limit,
      cursor: args.cursor ?? null
    };

    return await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_seq", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .paginate(paginationOpts);
  }
});
