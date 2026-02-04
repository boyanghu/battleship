"use client";

import { useCallback, useState } from "react";
import { View, XStack, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import BoardCell from "./boardCell";
import {
  type BoardSide,
  type BoardState,
  type Coordinate,
  COLUMNS,
  ROWS,
  toCoordinate,
} from "../types";

interface BoardProps {
  side: BoardSide;
  state: BoardState;
  label: string;
  isActive?: boolean;
  interactive?: boolean;
  recommendedCell?: Coordinate | null;
  onCellPress?: (coordinate: Coordinate) => void;
}

const CELL_SIZE = 32;
const CELL_GAP = 2;

/**
 * 10x10 game board with row/column labels.
 * Renders cells based on state and handles interactions.
 */
export default function Board({
  side,
  state,
  label,
  isActive = false,
  interactive = false,
  recommendedCell = null,
  onCellPress,
}: BoardProps) {
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);

  // Border color based on side and active state
  const borderColor = isActive
    ? side === "enemy"
      ? "$primary_500"
      : "$secondary_500"
    : "$neutral_700";

  // Label color based on side
  const labelColor = side === "enemy" ? "$primary_400" : "$secondary_400";

  const handleCellPress = useCallback(
    (coordinate: Coordinate) => {
      if (interactive && onCellPress) {
        onCellPress(coordinate);
      }
    },
    [interactive, onCellPress]
  );

  const getCellState = (coordinate: Coordinate) => {
    return state.cells.get(coordinate) ?? "empty";
  };

  return (
    <YStack alignItems="center" gap="$2">
      {/* Board label */}
      <UText variant="label-sm" color={labelColor}>
        {label}
      </UText>

      {/* Board container with border */}
      <View
        borderWidth={2}
        borderColor={borderColor}
        borderRadius={8}
        padding={8}
        backgroundColor="$neutral_850"
      >
        {/* Column headers */}
        <XStack gap={CELL_GAP} paddingLeft={CELL_SIZE + CELL_GAP}>
          {COLUMNS.map((col) => (
            <View
              key={col}
              width={CELL_SIZE}
              height={16}
              justifyContent="center"
              alignItems="center"
            >
              <UText variant="label-sm" color="$neutral_400">
                {col}
              </UText>
            </View>
          ))}
        </XStack>

        {/* Grid rows */}
        <YStack gap={CELL_GAP}>
          {ROWS.map((row) => (
            <XStack key={row} gap={CELL_GAP} alignItems="center">
              {/* Row label */}
              <View
                width={CELL_SIZE}
                height={CELL_SIZE}
                justifyContent="center"
                alignItems="flex-end"
                paddingRight={4}
              >
                <UText variant="label-sm" color="$neutral_400">
                  {row}
                </UText>
              </View>

              {/* Cells */}
              {COLUMNS.map((col) => {
                const coordinate = toCoordinate(col, row);
                return (
                  <BoardCell
                    key={coordinate}
                    state={getCellState(coordinate)}
                    side={side}
                    isHovered={hoveredCell === coordinate}
                    isRecommended={recommendedCell === coordinate}
                    interactive={interactive}
                    onPress={() => handleCellPress(coordinate)}
                    onHoverIn={() => setHoveredCell(coordinate)}
                    onHoverOut={() => setHoveredCell(null)}
                  />
                );
              })}
            </XStack>
          ))}
        </YStack>
      </View>
    </YStack>
  );
}
