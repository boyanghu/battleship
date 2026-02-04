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
  recommendedCell = null,
  enemyCells,
  yourCells,
  onCellPress,
}: BoardProps) {
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);

  // Border color based on side (from Figma design system)
  // Enemy = primary (blue), Player = secondary (orange)
  const borderColor = side === "enemy" ? "$primary_600" : "$secondary_500";

  // Label color based on side
  const labelColor = side === "enemy" ? "$primary_400" : "$secondary_400";

  const handleCellPress = useCallback(
    (coordinate: Coordinate) => {
      if (side === "enemy" && onCellPress) {
        onCellPress(coordinate);
      }
    },
    [side, onCellPress]
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
        const isRecommended = recommendedCell === coordinate;
        const isHovered = hoveredCell === coordinate;

        if (side === "enemy") {
          // Enemy cell - get state from map
          let cellState: EnemyCellState =
            enemyCells?.get(coordinate) ?? "neutral";
          if (isHovered && cellState === "neutral") {
            cellState = "hover";
          }

          cells.push(
            <EnemyCell
              key={coordinate}
              state={cellState}
              isGlow={isRecommended}
              onPress={() => handleCellPress(coordinate)}
              onHoverIn={() => setHoveredCell(coordinate)}
              onHoverOut={() => setHoveredCell(null)}
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
    <YStack alignItems="center" gap="$2">
      {/* Board title label */}
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
        }}
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
  );
}
