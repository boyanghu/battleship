"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, YStack } from "tamagui";
import { useMutation } from "convex/react";
import type { Id } from "@server/_generated/dataModel";
import { Check } from "@phosphor-icons/react";

import { api } from "@server/_generated/api";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { UIconTextButton } from "@/lib/components/core/button";
import useAnalytics from "@/lib/analytics/useAnalytics";
import StatusHud from "../statusHud";
import YourCell from "../yourCell";
import {
  type Coordinate,
  type YourCellState,
  BOARD_SIZE,
} from "../../types";
import {
  type Ship,
  type ShipType,
  rotateAndResolve,
  getShipCells,
  coordToString,
  xyToString,
} from "../../utils";
import { usePlacementDrag } from "../../hooks";

interface Board {
  ships: Ship[];
  shotsReceived: unknown[];
}

interface PlacementPhaseProps {
  gameId: string;
  deviceId: string;
  game: {
    placementStartedAt?: number;
    placementDurationMs?: number;
    boards: Record<string, Board>;
  };
}

const CELL_SIZE = 32;
const CELL_GAP = 4;
const BOARD_PADDING = 8;

/**
 * Placement phase - position your fleet before battle.
 * Ships are pre-generated randomly on join. Player can rotate ships before committing.
 */
export default function PlacementPhase({
  gameId,
  deviceId,
  game,
}: PlacementPhaseProps) {
  const typedGameId = gameId as Id<"games">;
  const { Event } = useAnalytics();

  // Board ref for drag calculations
  const boardRef = useRef<HTMLDivElement>(null);

  // Local ship state for modifications before committing
  const initialShips = game.boards[deviceId]?.ships ?? [];
  const [ships, setShips] = useState<Ship[]>(initialShips);
  const [isCommitting, setIsCommitting] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);

  const commitPlacement = useMutation(api.games.commitPlacement);
  const advanceFromPlacement = useMutation(api.games.advanceFromPlacement);

  // Track if we've already triggered the timer expiry mutation
  const timerExpiredRef = useRef(false);
  // Track if we've auto-deployed when timer is about to expire
  const autoDeployedRef = useRef(false);

  // Drag-and-drop functionality
  const {
    draggingShipType,
    dragPreviewOrigin,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  } = usePlacementDrag({
    ships,
    setShips,
    cellSize: CELL_SIZE,
    cellGap: CELL_GAP,
    boardPadding: BOARD_PADDING,
  });

  // Event builder for deploy button
  const deployButtonEvent = useMemo(
    () => Event().setProductName("Placement").setComponentName("DeployFleetButton"),
    [Event]
  );

  // Sync ships from game state if they change
  useEffect(() => {
    const serverShips = game.boards[deviceId]?.ships ?? [];
    if (serverShips.length > 0 && ships.length === 0) {
      setShips(serverShips);
    }
  }, [game.boards, deviceId, ships.length]);

  // Timer countdown - updates every 100ms for smooth display
  useEffect(() => {
    if (!game.placementStartedAt || !game.placementDurationMs) return;

    const updateTimer = () => {
      const endTime = game.placementStartedAt! + game.placementDurationMs!;
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemainingMs(remaining);
    };

    updateTimer();
    // Update every 100ms for smooth countdown (especially for final 5 seconds)
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [game.placementStartedAt, game.placementDurationMs]);

  // Auto-deploy when timer is about to expire (~500ms)
  // This ensures user's modifications are saved even if they don't click "Deploy Fleet"
  useEffect(() => {
    // Only trigger when time is between 0 and 500ms and not already deploying
    if (timeRemainingMs > 500 || timeRemainingMs <= 0) return;
    if (autoDeployedRef.current || isCommitting) return;

    // Mark as triggered to prevent multiple calls
    autoDeployedRef.current = true;

    // Commit current placement before time runs out
    commitPlacement({
      gameId: typedGameId,
      deviceId,
      ships,
    }).catch((error) => {
      console.error("Auto-deploy failed:", error);
      // Don't reset ref on error - we don't want to retry auto-deploy
    });
  }, [timeRemainingMs, isCommitting, commitPlacement, typedGameId, deviceId, ships]);

  // Auto-advance when timer expires
  useEffect(() => {
    if (timeRemainingMs > 0 || timerExpiredRef.current) return;
    if (!game.placementStartedAt || !game.placementDurationMs) return;

    // Mark as triggered to prevent multiple calls
    timerExpiredRef.current = true;

    // Call the mutation to advance to battle phase
    advanceFromPlacement({ gameId: typedGameId }).catch((error) => {
      console.error("Failed to advance from placement:", error);
      // Reset the ref in case of error so it can be retried
      timerExpiredRef.current = false;
    });
  }, [timeRemainingMs, game.placementStartedAt, game.placementDurationMs, advanceFromPlacement, typedGameId]);

  // Global mouse handlers for drag operations
  useEffect(() => {
    if (!draggingShipType) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      updateDrag(e.clientX, e.clientY, rect);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrag();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [draggingShipType, updateDrag, endDrag, cancelDrag]);

  // Rotate a ship with collision resolution
  const rotateShip = useCallback((shipType: ShipType) => {
    setShips((prev) => rotateAndResolve(prev, shipType));
  }, []);

  // Commit placement to server
  const handleCommit = useCallback(async () => {
    if (isCommitting) return;
    setIsCommitting(true);
    try {
      await commitPlacement({
        gameId: typedGameId,
        deviceId,
        ships,
      });
    } catch (error) {
      console.error("Failed to commit placement:", error);
      setIsCommitting(false);
    }
  }, [isCommitting, commitPlacement, typedGameId, deviceId, ships]);

  // Build cell state map from ships
  const cellStates = useMemo(() => {
    const map = new Map<Coordinate, YourCellState>();

    for (const ship of ships) {
      const { origin, orientation, length, shipType } = ship;

      for (let i = 0; i < length; i++) {
        const x = orientation === "horizontal" ? origin.x + i : origin.x;
        const y = orientation === "vertical" ? origin.y + i : origin.y;
        const coord: Coordinate = xyToString(x, y);

        // Determine cell state based on position
        let state: YourCellState;
        if (orientation === "horizontal") {
          if (i === 0) {
            // Left end with rotate button
            state = "ship-safe-left-rotate";
          } else if (i === length - 1) {
            state = "ship-safe-right";
          } else {
            state = "ship-safe-body";
          }
        } else {
          if (i === 0) {
            // Top end with rotate button
            state = "ship-safe-top-rotate";
          } else if (i === length - 1) {
            state = "ship-safe-bottom";
          } else {
            state = "ship-safe-body";
          }
        }

        // Store shipType for rotate handler lookup
        map.set(coord, state);
      }
    }

    return map;
  }, [ships]);

  // Map coordinates to ship types for rotate handling
  const coordToShipType = useMemo(() => {
    const map = new Map<Coordinate, ShipType>();

    for (const ship of ships) {
      const { origin, orientation, length, shipType } = ship;

      for (let i = 0; i < length; i++) {
        const x = orientation === "horizontal" ? origin.x + i : origin.x;
        const y = orientation === "vertical" ? origin.y + i : origin.y;
        const coord: Coordinate = xyToString(x, y);
        map.set(coord, shipType);
      }
    }

    return map;
  }, [ships]);

  // Preview cells for dragging ship
  const previewCells = useMemo(() => {
    if (!draggingShipType || !dragPreviewOrigin) return new Set<Coordinate>();

    const ship = ships.find((s) => s.shipType === draggingShipType);
    if (!ship) return new Set<Coordinate>();

    const previewShip = { ...ship, origin: dragPreviewOrigin };
    const cells = getShipCells(previewShip);

    return new Set(cells.map((c) => coordToString(c)));
  }, [draggingShipType, dragPreviewOrigin, ships]);

  // Generate coordinate from row/col indices (note: row=y, col=x)
  const toCoord = (row: number, col: number): Coordinate => xyToString(col, row);

  // Handle drag start on a ship cell
  const handleDragStart = useCallback(
    (shipType: ShipType, cellIndex: number) => (e: React.MouseEvent) => {
      if (!boardRef.current) return;
      // Prevent text selection during drag
      e.preventDefault();
      const rect = boardRef.current.getBoundingClientRect();
      startDrag(shipType, cellIndex, e.clientX, e.clientY, rect);
    },
    [startDrag]
  );

  // Render board cells
  const renderCells = () => {
    const cells = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const coordinate = toCoord(row, col);
        const cellState = cellStates.get(coordinate) ?? "neutral";
        const shipType = coordToShipType.get(coordinate);

        // Only add rotate handler for cells with rotate state
        const hasRotate = cellState.endsWith("-rotate");
        const handleRotate =
          hasRotate && shipType ? () => rotateShip(shipType) : undefined;

        // Check if this cell belongs to the dragging ship
        const isDragging = draggingShipType && shipType === draggingShipType;

        // Check if this cell is in the preview position
        const isPreview = previewCells.has(coordinate) && !isDragging;

        // Calculate cell index for drag start
        const ship = shipType
          ? ships.find((s) => s.shipType === shipType)
          : null;
        let cellIndex = 0;
        if (ship) {
          if (ship.orientation === "horizontal") {
            cellIndex = col - ship.origin.x;
          } else {
            cellIndex = row - ship.origin.y;
          }
        }

        cells.push(
          <YourCell
            key={coordinate}
            state={cellState}
            onRotate={handleRotate}
            onDragStart={shipType ? handleDragStart(shipType, cellIndex) : undefined}
            isDragging={isDragging ?? false}
            isPreview={isPreview}
            onHoverIn={() => setHoveredCell(coordinate)}
            onHoverOut={() => setHoveredCell(null)}
          />
        );
      }
    }

    return cells;
  };

  return (
    <UPage>
      <YStack flex={1} gap="$6" paddingTop="$4">
        {/* Status HUD - shows "POSITION YOUR FLEET" as center text */}
        <StatusHud
          phase="placement"
          turn="you"
          timeRemainingMs={timeRemainingMs}
          enemyShipsRemaining={5}
          playerShipsRemaining={5}
        />

        {/* Center content */}
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$6">
          {/* Board with label */}
          <YStack alignItems="center" gap="$2">
            <UText variant="label-sm" color="$secondary_400">
              YOUR FLEET
            </UText>

            {/* Board container */}
            <View
              ref={boardRef}
              borderWidth={1}
              borderColor="$secondary_500"
              borderRadius={14}
              padding={BOARD_PADDING}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
                gap: `${CELL_GAP}px`,
                userSelect: "none",
              } as React.CSSProperties}
            >
              {renderCells()}
            </View>

            {/* Bottom label - shows hovered cell coordinate */}
            <View height={16}>
              {hoveredCell && (
                <UText variant="label-sm" color="$neutral_400">
                  {hoveredCell.charAt(0)}:{hoveredCell.slice(1)}
                </UText>
              )}
            </View>
          </YStack>

          {/* Commit button with glow */}
          <UIconTextButton
            text={isCommitting ? "DEPLOYING..." : "DEPLOY FLEET"}
            icon={<Check size={20} weight="regular" />}
            variant="glow"
            disabled={isCommitting}
            onPress={handleCommit}
            eventBuilder={deployButtonEvent}
          />
        </YStack>
      </YStack>
    </UPage>
  );
}
