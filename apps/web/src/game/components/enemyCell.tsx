"use client";

import { View } from "tamagui";
import { type EnemyCellState } from "../types";

interface EnemyCellProps {
  state?: EnemyCellState;
  isGlow?: boolean; // Recommended cell glow effect
  onPress?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

const CELL_SIZE = 32;

// Glow box shadow for recommended cell (from Figma)
const glowShadow = `
  0px 2px 4px 0px #7fb2ff,
  0px 4px 26px 0px #3b82f6,
  0px -1px 4px 0px #ffd08a,
  0px -2px 24px 0px #ff9b00
`;

/**
 * Enemy board cell - shows hits, misses, and sunk markers.
 * States from Figma: neutral, hover, miss, hit, sunk, glow
 */
export default function EnemyCell({
  state = "neutral",
  isGlow = false,
  onPress,
  onHoverIn,
  onHoverOut,
}: EnemyCellProps) {
  // Background color based on state
  const getBackgroundColor = () => {
    if (state === "sunk") return "transparent";
    if (state === "miss") return "$neutral_900";
    if (state === "hover") return "$neutral_700";
    return "$neutral_800";
  };

  // Whether to show hit/sunk marker (red dot)
  const showHitMarker = state === "hit" || state === "sunk";

  // Whether to show miss marker (white hollow circle)
  const showMissMarker = state === "miss";

  return (
    <View
      width={CELL_SIZE}
      height={CELL_SIZE}
      backgroundColor={getBackgroundColor()}
      borderRadius={4}
      justifyContent="center"
      alignItems="center"
      cursor="pointer"
      position="relative"
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      hoverStyle={{ backgroundColor: "$neutral_700" }}
      // @ts-expect-error - style prop for box-shadow
      style={isGlow ? { boxShadow: glowShadow } : undefined}
    >
      {/* Hit/Sunk marker - red dot */}
      {showHitMarker && (
        <View
          width={8}
          height={8}
          borderRadius="$round"
          backgroundColor="$destructive_500"
        />
      )}

      {/* Miss marker - white hollow circle */}
      {showMissMarker && (
        <View
          width={8}
          height={8}
          borderRadius="$round"
          borderWidth={2}
          borderColor="$neutral_400"
          backgroundColor="transparent"
        />
      )}
    </View>
  );
}
