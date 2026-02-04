"use client";

import { useCallback, useState, useRef } from "react";
import {
  type Ship,
  type ShipType,
  type Coord,
  moveAndResolve,
  clampDragPosition,
} from "../utils";
import { BOARD_SIZE } from "../types";

// =============================================================================
// TYPES
// =============================================================================

interface UsePlacementDragOptions {
  ships: Ship[];
  setShips: (ships: Ship[]) => void;
  cellSize: number;
  cellGap: number;
  boardPadding: number;
}

interface DragState {
  shipType: ShipType;
  /** Offset from ship origin to mouse position in cells */
  offsetX: number;
  offsetY: number;
  /** Preview position (clamped) */
  previewOrigin: Coord;
}

interface UsePlacementDragResult {
  /** Currently dragging ship type (null if not dragging) */
  draggingShipType: ShipType | null;
  /** Preview origin position during drag */
  dragPreviewOrigin: Coord | null;
  /** Start dragging a ship */
  startDrag: (
    shipType: ShipType,
    cellIndex: number,
    clientX: number,
    clientY: number,
    boardRect: DOMRect
  ) => void;
  /** Update drag position */
  updateDrag: (clientX: number, clientY: number, boardRect: DOMRect) => void;
  /** End drag and commit position */
  endDrag: () => void;
  /** Cancel drag without committing */
  cancelDrag: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing ship drag-and-drop during placement phase
 *
 * Behavior:
 * - Ships are draggable as a single unit
 * - Dragging snaps to grid cells
 * - Dragging outside the board clamps to nearest valid position
 * - On drop, collision resolution runs automatically
 */
export function usePlacementDrag({
  ships,
  setShips,
  cellSize,
  cellGap,
  boardPadding,
}: UsePlacementDragOptions): UsePlacementDragResult {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Store ships ref for use in callbacks without dependency
  const shipsRef = useRef(ships);
  shipsRef.current = ships;

  // Calculate cell position from pixel coordinates relative to board
  const pixelToCell = useCallback(
    (pixelX: number, pixelY: number): Coord => {
      // Account for padding
      const adjustedX = pixelX - boardPadding;
      const adjustedY = pixelY - boardPadding;

      // Calculate cell (accounting for gap)
      const cellWithGap = cellSize + cellGap;
      const x = Math.floor(adjustedX / cellWithGap);
      const y = Math.floor(adjustedY / cellWithGap);

      return { x, y };
    },
    [cellSize, cellGap, boardPadding]
  );

  // Start dragging a ship
  const startDrag = useCallback(
    (
      shipType: ShipType,
      cellIndex: number,
      clientX: number,
      clientY: number,
      boardRect: DOMRect
    ) => {
      const ship = shipsRef.current.find((s) => s.shipType === shipType);
      if (!ship) return;

      // Calculate mouse position relative to board
      const relX = clientX - boardRect.left;
      const relY = clientY - boardRect.top;

      // Get the cell being clicked
      const clickedCell = pixelToCell(relX, relY);

      // Calculate offset from ship origin to clicked cell
      const offsetX = clickedCell.x - ship.origin.x;
      const offsetY = clickedCell.y - ship.origin.y;

      setDragState({
        shipType,
        offsetX,
        offsetY,
        previewOrigin: ship.origin,
      });
    },
    [pixelToCell]
  );

  // Update drag position
  const updateDrag = useCallback(
    (clientX: number, clientY: number, boardRect: DOMRect) => {
      if (!dragState) return;

      const ship = shipsRef.current.find(
        (s) => s.shipType === dragState.shipType
      );
      if (!ship) return;

      // Calculate mouse position relative to board
      const relX = clientX - boardRect.left;
      const relY = clientY - boardRect.top;

      // Get the cell under mouse
      const mouseCell = pixelToCell(relX, relY);

      // Calculate new origin based on drag offset
      const newOrigin: Coord = {
        x: mouseCell.x - dragState.offsetX,
        y: mouseCell.y - dragState.offsetY,
      };

      // Clamp to bounds (preview only)
      const clampedOrigin = clampDragPosition(ship, newOrigin);

      setDragState((prev) =>
        prev ? { ...prev, previewOrigin: clampedOrigin } : null
      );
    },
    [dragState, pixelToCell]
  );

  // End drag and commit position
  const endDrag = useCallback(() => {
    if (!dragState) return;

    const ship = shipsRef.current.find(
      (s) => s.shipType === dragState.shipType
    );
    if (!ship) {
      setDragState(null);
      return;
    }

    // Only update if position changed
    if (
      dragState.previewOrigin.x !== ship.origin.x ||
      dragState.previewOrigin.y !== ship.origin.y
    ) {
      // Apply move with collision resolution
      const resolved = moveAndResolve(
        shipsRef.current,
        dragState.shipType,
        dragState.previewOrigin
      );
      setShips(resolved);
    }

    setDragState(null);
  }, [dragState, setShips]);

  // Cancel drag without committing
  const cancelDrag = useCallback(() => {
    setDragState(null);
  }, []);

  return {
    draggingShipType: dragState?.shipType ?? null,
    dragPreviewOrigin: dragState?.previewOrigin ?? null,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };
}

export default usePlacementDrag;
