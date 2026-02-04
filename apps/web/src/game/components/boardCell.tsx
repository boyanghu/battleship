"use client";

import { View } from "tamagui";
import { type CellState, type BoardSide } from "../types";

interface BoardCellProps {
  state: CellState;
  side: BoardSide;
  isHovered?: boolean;
  isRecommended?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

const CELL_SIZE = 32;

/**
 * Individual cell on the game board.
 * Renders different states: empty, hit, miss, ship, ship-hit.
 */
export default function BoardCell({
  state,
  side,
  isHovered = false,
  isRecommended = false,
  interactive = false,
  onPress,
  onHoverIn,
  onHoverOut,
}: BoardCellProps) {
  // Base cell styling
  const getCellBackground = () => {
    if (isHovered && interactive) {
      return "$neutral_700";
    }
    if (isRecommended) {
      return "$neutral_750";
    }
    return "$neutral_800";
  };

  // Render hit marker (red dot)
  const renderHitMarker = () => (
    <View
      width={10}
      height={10}
      borderRadius="$round"
      backgroundColor="$destructive_500"
    />
  );

  // Render miss marker (white circle outline)
  const renderMissMarker = () => (
    <View
      width={10}
      height={10}
      borderRadius="$round"
      borderWidth={2}
      borderColor="$neutral_400"
      backgroundColor="transparent"
    />
  );

  // Render ship segment (for player board only)
  const renderShipSegment = () => (
    <View
      position="absolute"
      top={2}
      left={2}
      right={2}
      bottom={2}
      borderRadius={4}
      borderWidth={2}
      borderColor={side === "player" ? "$secondary_400" : "$primary_400"}
      backgroundColor="transparent"
    />
  );

  return (
    <View
      width={CELL_SIZE}
      height={CELL_SIZE}
      backgroundColor={getCellBackground()}
      borderRadius={2}
      justifyContent="center"
      alignItems="center"
      cursor={interactive ? "pointer" : "default"}
      onPress={interactive ? onPress : undefined}
      onHoverIn={interactive ? onHoverIn : undefined}
      onHoverOut={interactive ? onHoverOut : undefined}
      position="relative"
      hoverStyle={interactive ? { backgroundColor: "$neutral_700" } : undefined}
    >
      {/* Ship segment (rendered behind markers) */}
      {(state === "ship" || state === "ship-hit") && renderShipSegment()}

      {/* State markers */}
      {state === "hit" && renderHitMarker()}
      {state === "miss" && renderMissMarker()}
      {state === "ship-hit" && renderHitMarker()}

      {/* Recommended cell highlight */}
      {isRecommended && (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          borderWidth={2}
          borderColor="$secondary_500"
          borderRadius={2}
          opacity={0.8}
        />
      )}
    </View>
  );
}
