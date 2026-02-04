"use client";

import { useCallback } from "react";
import CellPlumeEffect, { type PlumeVariant } from "./CellPlumeEffect";
import type { Coordinate } from "../../types";
import { stringToCoord } from "../../utils";

// Board layout constants (must match board.tsx)
const CELL_SIZE = 32;
const CELL_GAP = 4;
const BOARD_PADDING = 8;

/**
 * Effect instance representing a single plume effect on a board.
 */
export interface EffectInstance {
  id: string;
  coord: Coordinate; // e.g., "A1", "J10"
  variant: PlumeVariant;
  createdAt: number;
}

interface EffectsOverlayProps {
  effects: EffectInstance[];
  onEffectComplete: (id: string) => void;
}

/**
 * Calculate pixel position for the center of a cell.
 */
function getCellCenterPx(row: number, col: number): { x: number; y: number } {
  // Position within the grid (accounting for gaps)
  const x = BOARD_PADDING + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const y = BOARD_PADDING + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  return { x, y };
}

/**
 * EffectsOverlay - Container for transient plume effects on a board.
 * 
 * Renders as an absolutely positioned layer over the board grid.
 * Manages positioning of effect instances based on cell coordinates.
 * Auto-removes effects when their animation completes.
 */
export default function EffectsOverlay({
  effects,
  onEffectComplete,
}: EffectsOverlayProps) {
  const handleComplete = useCallback(
    (id: string) => {
      onEffectComplete(id);
    },
    [onEffectComplete]
  );

  if (effects.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        overflow: "visible", // Allow plumes to overflow cell bounds
        zIndex: 100, // Above cells and ships
      }}
    >
      {effects.map((effect) => {
        const { x: col, y: row } = stringToCoord(effect.coord);
        const { x, y } = getCellCenterPx(row, col);

        return (
          <div
            key={effect.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
            }}
          >
            <CellPlumeEffect
              variant={effect.variant}
              onComplete={() => handleComplete(effect.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
