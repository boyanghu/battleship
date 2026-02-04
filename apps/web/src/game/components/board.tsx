"use client";

import { useCallback, useState } from "react";
import { View, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import EnemyCell from "./enemyCell";
import YourCell from "./yourCell";
import {
  type BoardSide,
  type Coordinate,
  type EnemyCellState,
  type YourCellState,
  BOARD_SIZE,
} from "../types";

interface BoardProps {
  side: BoardSide;
  label: string;
  isActive?: boolean;
  highlighted?: boolean; // Visual emphasis state
  disabled?: boolean; // Prevents all interactions
  recommendedCell?: Coordinate | null;
  enemyCells?: Map<Coordinate, EnemyCellState>;
  yourCells?: Map<Coordinate, YourCellState>;
  onCellPress?: (coordinate: Coordinate) => void;
}

const CELL_SIZE = 32;
const CELL_GAP = 4;

/**
 * 10x10 game board with CSS grid layout.
 * No row/column labels - clean grid with title above and "B:10" below.
 */
export default function Board({
  side,
  label,
  isActive = false,
  highlighted = true,
  disabled = false,
  recommendedCell = null,
  enemyCells,
  yourCells,
  onCellPress,
}: BoardProps) {
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);

  // Border color based on side and highlight state (from Figma design system)
  // Enemy = primary (blue), Player = secondary (orange)
  // De-emphasized boards use dimmer colors
  const getBorderColor = () => {
    if (!highlighted) {
      return "$neutral_700"; // De-emphasized
    }
    return side === "enemy" ? "$primary_600" : "$secondary_500";
  };
  const borderColor = getBorderColor();

  // Label color based on side and highlight state
  const getLabelColor = () => {
    if (!highlighted) {
      return "$neutral_500"; // De-emphasized
    }
    return side === "enemy" ? "$primary_400" : "$secondary_400";
  };
  const labelColor = getLabelColor();

  // Opacity for de-emphasized state
  const boardOpacity = highlighted ? 1 : 0.6;

  const handleCellPress = useCallback(
    (coordinate: Coordinate) => {
      // Only allow pressing enemy cells when not disabled
      if (side === "enemy" && onCellPress && !disabled) {
        onCellPress(coordinate);
      }
    },
    [side, onCellPress, disabled]
  );

  // Generate coordinate from row/col indices
  const toCoord = (row: number, col: number): Coordinate => {
    const colLetter = String.fromCharCode(65 + col); // A-J
    return `${colLetter}${row + 1}`;
  };

  // Render all cells in CSS grid
  const renderCells = () => {
    const cells = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const coordinate = toCoord(row, col);
        const isRecommended = recommendedCell === coordinate && !disabled;
        const isHovered = hoveredCell === coordinate && !disabled;

        if (side === "enemy") {
          // Enemy cell - get state from map
          let cellState: EnemyCellState =
            enemyCells?.get(coordinate) ?? "neutral";
          // Only show hover state if not disabled
          if (isHovered && cellState === "neutral") {
            cellState = "hover";
          }

          cells.push(
            <EnemyCell
              key={coordinate}
              state={cellState}
              isGlow={isRecommended}
              onPress={disabled ? undefined : () => handleCellPress(coordinate)}
              onHoverIn={disabled ? undefined : () => setHoveredCell(coordinate)}
              onHoverOut={disabled ? undefined : () => setHoveredCell(null)}
            />
          );
        } else {
          // Your cell - get state from map
          const cellState: YourCellState =
            yourCells?.get(coordinate) ?? "neutral";

          cells.push(
            <YourCell
              key={coordinate}
              state={cellState}
              onHoverIn={() => setHoveredCell(coordinate)}
              onHoverOut={() => setHoveredCell(null)}
            />
          );
        }
      }
    }

    return cells;
  };

  return (
    <YStack alignItems="center" gap="$2" opacity={boardOpacity}>
      {/* Board title label (LOCKED COPY) */}
      <UText variant="label-sm" color={labelColor}>
        {label}
      </UText>

      {/* Board container with border */}
      <View
        borderWidth={1}
        borderColor={borderColor}
        borderRadius={14}
        padding={8}
        // @ts-expect-error - CSS grid properties
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          gap: `${CELL_GAP}px`,
          cursor: disabled ? "not-allowed" : undefined,
        }}
      >
        {renderCells()}
      </View>

      {/* Bottom label - shows hovered cell coordinate */}
      <View height={16}>
        {hoveredCell && !disabled && (
          <UText variant="label-sm" color="$neutral_400">
            {hoveredCell.charAt(0)}:{hoveredCell.slice(1)}
          </UText>
        )}
      </View>
    </YStack>
  );
}
