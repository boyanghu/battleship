"use client";

import { View } from "tamagui";
import { useGlowAnimation } from "@/lib/styles";
import { type EnemyCellState } from "../types";
import CellMarker from "./cellMarker";

interface EnemyCellProps {
  state?: EnemyCellState;
  isGlow?: boolean; // Recommended cell glow effect (pulsating)
  onPress?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

const CELL_SIZE = 32;

/**
 * Enemy board cell - shows hits, misses, and sunk markers.
 * States from Figma: neutral, hover, miss, hit, sunk, glow
 * When isGlow is true, shows pulsating glow animation for strategist recommendation.
 */
export default function EnemyCell({
  state = "neutral",
  isGlow = false,
  onPress,
  onHoverIn,
  onHoverOut,
}: EnemyCellProps) {
  // Pulsating glow animation for recommended cell
  const { GlowStyles, glowStyle } = useGlowAnimation({
    duration: 1000,
    enabled: isGlow,
  });
  // Background color based on state
  const getBackgroundColor = () => {
    if (state === "sunk") return "$destructive_500"; // Red background for sunk
    if (state === "miss") return "$neutral_900";
    if (state === "hover") return "$neutral_700";
    return "$neutral_800";
  };

  // Determine which marker to show (if any)
  const markerType =
    state === "sunk" ? "sunk" : state === "hit" ? "hit" : state === "miss" ? "miss" : null;

  return (
    <>
      {/* Inject glow animation keyframes when needed */}
      {isGlow && <GlowStyles />}

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
        style={{
          transition: "background-color 50ms ease-out",
          ...(isGlow ? glowStyle : {}),
        } as React.CSSProperties}
      >
        {/* Marker for hit, sunk, or miss states */}
        {markerType && <CellMarker type={markerType} />}
      </View>
    </>
  );
}
