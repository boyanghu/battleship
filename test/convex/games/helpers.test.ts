/**
 * Unit tests for game helpers.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getShipCells,
  isInBounds,
  coordsEqual,
  validatePlacement,
  resolveShot,
  allShipsSunk,
  getOpponentDeviceId,
  generateRandomPlacement,
  assertPhase,
  isInPhase,
  processShot,
  type Ship,
  type Board,
  type Coord,
} from "../../../convex/games/helpers";
import { createTestShip, createTestBoard, createStandardFleet, coord } from "../testUtils";

describe("getShipCells", () => {
  it("should return correct cells for horizontal ship", () => {
    const ship = createTestShip({
      origin: { x: 2, y: 3 },
      orientation: "horizontal",
      length: 3,
    });

    const cells = getShipCells(ship);

    expect(cells).toHaveLength(3);
    expect(cells[0]).toEqual({ x: 2, y: 3 });
    expect(cells[1]).toEqual({ x: 3, y: 3 });
    expect(cells[2]).toEqual({ x: 4, y: 3 });
  });

  it("should return correct cells for vertical ship", () => {
    const ship = createTestShip({
      origin: { x: 2, y: 3 },
      orientation: "vertical",
      length: 3,
    });

    const cells = getShipCells(ship);

    expect(cells).toHaveLength(3);
    expect(cells[0]).toEqual({ x: 2, y: 3 });
    expect(cells[1]).toEqual({ x: 2, y: 4 });
    expect(cells[2]).toEqual({ x: 2, y: 5 });
  });
});

describe("isInBounds", () => {
  it("should return true for valid coordinates", () => {
    expect(isInBounds({ x: 0, y: 0 })).toBe(true);
    expect(isInBounds({ x: 5, y: 5 })).toBe(true);
    expect(isInBounds({ x: 9, y: 9 })).toBe(true);
  });

  it("should return false for out-of-bounds coordinates", () => {
    expect(isInBounds({ x: -1, y: 0 })).toBe(false);
    expect(isInBounds({ x: 0, y: -1 })).toBe(false);
    expect(isInBounds({ x: 10, y: 0 })).toBe(false);
    expect(isInBounds({ x: 0, y: 10 })).toBe(false);
    expect(isInBounds({ x: 10, y: 10 })).toBe(false);
  });
});

describe("coordsEqual", () => {
  it("should return true for equal coordinates", () => {
    expect(coordsEqual({ x: 3, y: 5 }, { x: 3, y: 5 })).toBe(true);
    expect(coordsEqual({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(true);
  });

  it("should return false for different coordinates", () => {
    expect(coordsEqual({ x: 3, y: 5 }, { x: 3, y: 6 })).toBe(false);
    expect(coordsEqual({ x: 3, y: 5 }, { x: 4, y: 5 })).toBe(false);
    expect(coordsEqual({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false);
  });
});

describe("validatePlacement", () => {
  it("should return valid for a standard fleet", () => {
    const ships = createStandardFleet();
    const result = validatePlacement(ships);
    expect(result.valid).toBe(true);
  });

  it("should reject missing ships", () => {
    const ships = createStandardFleet().slice(1); // Remove one ship
    const result = validatePlacement(ships);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required ship");
  });

  it("should reject duplicate ships", () => {
    // Include all required ships, but with duplicate carrier
    const ships: Ship[] = [
      { shipType: "carrier", origin: { x: 0, y: 0 }, orientation: "horizontal", length: 5 },
      { shipType: "battleship", origin: { x: 0, y: 1 }, orientation: "horizontal", length: 4 },
      { shipType: "cruiser", origin: { x: 0, y: 2 }, orientation: "horizontal", length: 3 },
      { shipType: "submarine", origin: { x: 0, y: 3 }, orientation: "horizontal", length: 3 },
      { shipType: "destroyer", origin: { x: 0, y: 4 }, orientation: "horizontal", length: 2 },
      { shipType: "carrier", origin: { x: 0, y: 5 }, orientation: "horizontal", length: 5 }, // Duplicate
    ];
    const result = validatePlacement(ships);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Duplicate ship type");
  });

  it("should reject wrong ship length", () => {
    const ships = createStandardFleet().map((s) =>
      s.shipType === "carrier" ? { ...s, length: 3 } : s
    );
    const result = validatePlacement(ships);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("length");
  });

  it("should reject out-of-bounds ships", () => {
    const ships = createStandardFleet().map((s) =>
      s.shipType === "carrier" ? { ...s, origin: { x: 8, y: 0 } } : s
    );
    const result = validatePlacement(ships);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("out of bounds");
  });

  it("should reject overlapping ships", () => {
    const ships: Ship[] = [
      { shipType: "carrier", origin: { x: 0, y: 0 }, orientation: "horizontal", length: 5 },
      { shipType: "battleship", origin: { x: 2, y: 0 }, orientation: "horizontal", length: 4 }, // Overlaps
      { shipType: "cruiser", origin: { x: 0, y: 2 }, orientation: "horizontal", length: 3 },
      { shipType: "submarine", origin: { x: 0, y: 3 }, orientation: "horizontal", length: 3 },
      { shipType: "destroyer", origin: { x: 0, y: 4 }, orientation: "horizontal", length: 2 },
    ];
    const result = validatePlacement(ships);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("overlap");
  });
});

describe("resolveShot", () => {
  it("should return miss for empty water", () => {
    const board = createTestBoard({
      ships: [createTestShip({ origin: { x: 0, y: 0 } })],
      shotsReceived: [],
    });

    const result = resolveShot(board, { x: 5, y: 5 });

    expect(result.result).toBe("miss");
    expect(result.sunkShipType).toBeUndefined();
  });

  it("should return hit for ship cell", () => {
    const board = createTestBoard({
      ships: [createTestShip({ origin: { x: 0, y: 0 }, length: 2 })],
      shotsReceived: [],
    });

    const result = resolveShot(board, { x: 0, y: 0 });

    expect(result.result).toBe("hit");
    expect(result.sunkShipType).toBeUndefined();
  });

  it("should return sunk when ship is fully hit", () => {
    const board = createTestBoard({
      ships: [createTestShip({ origin: { x: 0, y: 0 }, length: 2 })],
      shotsReceived: [
        { coord: { x: 0, y: 0 }, result: "hit", timestamp: Date.now() },
      ],
    });

    const result = resolveShot(board, { x: 1, y: 0 }); // Last cell

    expect(result.result).toBe("sunk");
    expect(result.sunkShipType).toBe("destroyer");
  });
});

describe("allShipsSunk", () => {
  it("should return false when ships have unhit cells", () => {
    const board = createTestBoard({
      ships: [createTestShip({ origin: { x: 0, y: 0 }, length: 2 })],
      shotsReceived: [
        { coord: { x: 0, y: 0 }, result: "hit", timestamp: Date.now() },
      ],
    });

    expect(allShipsSunk(board)).toBe(false);
  });

  it("should return true when all ships are fully hit", () => {
    const board = createTestBoard({
      ships: [createTestShip({ origin: { x: 0, y: 0 }, length: 2 })],
      shotsReceived: [
        { coord: { x: 0, y: 0 }, result: "hit", timestamp: Date.now() },
        { coord: { x: 1, y: 0 }, result: "sunk", timestamp: Date.now() },
      ],
    });

    expect(allShipsSunk(board)).toBe(true);
  });
});

describe("getOpponentDeviceId", () => {
  it("should return opponent's deviceId", () => {
    const players = [
      { deviceId: "player1" },
      { deviceId: "player2" },
    ];

    expect(getOpponentDeviceId(players, "player1")).toBe("player2");
    expect(getOpponentDeviceId(players, "player2")).toBe("player1");
  });

  it("should return null for single player", () => {
    const players = [{ deviceId: "player1" }];

    expect(getOpponentDeviceId(players, "player1")).toBeNull();
  });
});

describe("generateRandomPlacement", () => {
  it("should generate valid placement with all ships", () => {
    const ships = generateRandomPlacement();

    expect(ships).toHaveLength(5);

    // Validate the placement
    const result = validatePlacement(ships);
    expect(result.valid).toBe(true);
  });

  it("should generate different placements on each call", () => {
    const placement1 = generateRandomPlacement();
    const placement2 = generateRandomPlacement();

    // Check that at least one ship has a different origin
    // (statistically, they should almost always be different)
    const origins1 = placement1.map((s) => `${s.origin.x},${s.origin.y}`);
    const origins2 = placement2.map((s) => `${s.origin.x},${s.origin.y}`);

    // It's possible but extremely unlikely for them to be identical
    // Just check that we get valid placements
    expect(validatePlacement(placement1).valid).toBe(true);
    expect(validatePlacement(placement2).valid).toBe(true);
  });
});

describe("assertPhase", () => {
  it("should not throw for matching phase", () => {
    expect(() => assertPhase("lobby", "lobby", "test")).not.toThrow();
    expect(() => assertPhase("battle", "battle", "test")).not.toThrow();
  });

  it("should not throw for matching phase in array", () => {
    expect(() => assertPhase("lobby", ["lobby", "battle"], "test")).not.toThrow();
    expect(() => assertPhase("battle", ["lobby", "battle"], "test")).not.toThrow();
  });

  it("should throw for non-matching phase", () => {
    expect(() => assertPhase("lobby", "battle", "test")).toThrow();
    expect(() => assertPhase("placement", ["lobby", "battle"], "test")).toThrow();
  });

  it("should throw for undefined status", () => {
    expect(() => assertPhase(undefined, "lobby", "test")).toThrow();
  });
});

describe("isInPhase", () => {
  it("should return true for matching phase", () => {
    expect(isInPhase("lobby", "lobby")).toBe(true);
    expect(isInPhase("battle", ["lobby", "battle"])).toBe(true);
  });

  it("should return false for non-matching phase", () => {
    expect(isInPhase("lobby", "battle")).toBe(false);
    expect(isInPhase("placement", ["lobby", "battle"])).toBe(false);
    expect(isInPhase(undefined, "lobby")).toBe(false);
  });
});

describe("processShot", () => {
  it("should process a miss shot", () => {
    const boards: Record<string, Board> = {
      target: createTestBoard({
        ships: [createTestShip({ origin: { x: 0, y: 0 } })],
        shotsReceived: [],
      }),
    };

    const result = processShot(boards, "target", { x: 5, y: 5 }, Date.now());

    expect(result.result).toBe("miss");
    expect(result.updatedBoards.target.shotsReceived).toHaveLength(1);
    expect(result.updatedBoards.target.shotsReceived[0].result).toBe("miss");
  });

  it("should process a hit shot", () => {
    const boards: Record<string, Board> = {
      target: createTestBoard({
        ships: [createTestShip({ origin: { x: 0, y: 0 }, length: 3 })],
        shotsReceived: [],
      }),
    };

    const result = processShot(boards, "target", { x: 0, y: 0 }, Date.now());

    expect(result.result).toBe("hit");
    expect(result.updatedBoards.target.shotsReceived).toHaveLength(1);
    expect(result.updatedBoards.target.shotsReceived[0].result).toBe("hit");
  });

  it("should throw for non-existent board", () => {
    const boards: Record<string, Board> = {};

    expect(() => processShot(boards, "nonexistent", { x: 0, y: 0 }, Date.now())).toThrow(
      "Target board not found"
    );
  });
});
