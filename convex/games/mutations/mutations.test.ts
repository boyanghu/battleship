/**
 * Integration tests for game mutations.
 *
 * These tests use convex-test to mock the database and test mutation handlers.
 */

import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import { api } from "../../_generated/api";
import schema from "../../schema";

// Import modules for convex-test
const modules = import.meta.glob("../../**/*.ts");

describe("createGame", () => {
  it("should create a PvP game in lobby status", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pvp",
    });

    expect(result.gameId).toBeDefined();

    // Verify game state
    const game = await t.query(api.games.getGame, {
      gameId: result.gameId,
      deviceId: "player1",
    });

    expect(game).not.toBeNull();
    expect(game?.status).toBe("lobby");
    expect(game?.mode).toBe("pvp");
    expect(game?.hostDeviceId).toBe("player1");
    expect(game?.players).toHaveLength(1);
    expect(game?.players[0].deviceId).toBe("player1");
  });

  it("should create a PvE game in countdown status", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pve",
    });

    expect(result.gameId).toBeDefined();

    const game = await t.query(api.games.getGame, {
      gameId: result.gameId,
      deviceId: "player1",
    });

    expect(game?.status).toBe("countdown");
    expect(game?.mode).toBe("pve");
    expect(game?.players).toHaveLength(2); // Player + Bot
  });
});

describe("joinGame", () => {
  it("should allow a second player to join", async () => {
    const t = convexTest(schema, modules);

    // Create game
    const { gameId } = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pvp",
    });

    // Join game
    await t.mutation(api.games.joinGame, {
      gameId,
      deviceId: "player2",
    });

    // Verify
    const game = await t.query(api.games.getGame, {
      gameId,
      deviceId: "player1",
    });

    expect(game?.players).toHaveLength(2);
    expect(game?.players.some((p) => p.deviceId === "player2")).toBe(true);
  });

  it("should reject joining a full game", async () => {
    const t = convexTest(schema, modules);

    // Create game
    const { gameId } = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pvp",
    });

    // Join first player2
    await t.mutation(api.games.joinGame, {
      gameId,
      deviceId: "player2",
    });

    // Try to join player3
    await expect(
      t.mutation(api.games.joinGame, {
        gameId,
        deviceId: "player3",
      })
    ).rejects.toThrow("Game is full");
  });
});

describe("setReady", () => {
  it("should mark player as ready", async () => {
    const t = convexTest(schema, modules);

    // Create game
    const { gameId } = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pvp",
    });

    // Set ready
    await t.mutation(api.games.setReady, {
      gameId,
      deviceId: "player1",
      ready: true,
    });

    const game = await t.query(api.games.getGame, {
      gameId,
      deviceId: "player1",
    });

    expect(game?.players[0].ready).toBe(true);
  });

  it("should start countdown when all players are ready", async () => {
    const t = convexTest(schema, modules);

    // Create game
    const { gameId } = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pvp",
    });

    // Join player2
    await t.mutation(api.games.joinGame, {
      gameId,
      deviceId: "player2",
    });

    // Both players ready
    await t.mutation(api.games.setReady, {
      gameId,
      deviceId: "player1",
      ready: true,
    });

    await t.mutation(api.games.setReady, {
      gameId,
      deviceId: "player2",
      ready: true,
    });

    const game = await t.query(api.games.getGame, {
      gameId,
      deviceId: "player1",
    });

    expect(game?.status).toBe("countdown");
  });
});

describe("fireShot", () => {
  it("should reject firing when not your turn", async () => {
    const t = convexTest(schema, modules);

    // Create PvE game (starts in countdown, then placement)
    const { gameId } = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pve",
    });

    // Try to fire before game is in battle
    await expect(
      t.mutation(api.games.fireShot, {
        gameId,
        deviceId: "player1",
        coord: { x: 0, y: 0 },
      })
    ).rejects.toThrow();
  });
});

describe("commitPlacement", () => {
  it("should reject invalid placement", async () => {
    const t = convexTest(schema, modules);

    // Create PvE game
    const { gameId } = await t.mutation(api.games.createGame, {
      deviceId: "player1",
      mode: "pve",
    });

    // Advance time past countdown (5 seconds)
    await t.run(async (ctx) => {
      // Fast-forward time by 6 seconds
      vi.advanceTimersByTime(6000);
    });

    // Advance to placement phase
    await t.mutation(api.games.advanceFromCountdown, {
      gameId,
    });

    // Try to commit with empty ships array
    await expect(
      t.mutation(api.games.commitPlacement, {
        gameId,
        deviceId: "player1",
        ships: [],
      })
    ).rejects.toThrow("Invalid placement");
  });
});
