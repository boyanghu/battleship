"use client";

import { View } from "tamagui";

/** Marker types for cell state indication */
export type MarkerType = "hit" | "sunk" | "miss";

interface CellMarkerProps {
  /** Type of marker to display */
  type: MarkerType;
  /** Size of the marker in pixels (default: 8) */
  size?: number;
}

/**
 * Cell marker - displays hit, sunk, or miss indicators on board cells.
 *
 * Variants:
 * - hit: Solid red circle (destructive_500)
 * - sunk: Solid dark circle on red background (neutral_800)
 * - miss: Hollow circle with neutral border (neutral_400)
 *
 * Used by both EnemyCell and YourCell components.
 */
export default function CellMarker({ type, size = 8 }: CellMarkerProps) {
  // Hit and sunk markers are solid circles, miss is hollow
  const isMiss = type === "miss";

  // Marker color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case "hit":
        return "$destructive_500";
      case "sunk":
        return "$neutral_800"; // Dark dot on red background
      case "miss":
        return "transparent";
    }
  };

  return (
    <View
      width={size}
      height={size}
      borderRadius="$round"
      backgroundColor={getBackgroundColor()}
      borderWidth={isMiss ? 2 : 0}
      borderColor={isMiss ? "$neutral_400" : "transparent"}
    />
  );
}
