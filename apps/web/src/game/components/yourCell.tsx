"use client";

import { View } from "tamagui";
import { type YourCellState } from "../types";

interface YourCellProps {
  state?: YourCellState;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

const CELL_SIZE = 32;

// Border radius values (from Figma)
const RADIUS_ROUND = 999;
const RADIUS_SMALL = 4;

/**
 * Your board cell - shows ships with rounded ends and hit markers.
 * Ship parts from Figma: left/right/top/bottom (rounded ends), body (all small radius)
 * Variants: safe (orange), hit (red + marker), sunk (red + marker, no fill)
 */
export default function YourCell({
  state = "neutral",
  onHoverIn,
  onHoverOut,
}: YourCellProps) {
  // Parse state into parts
  const isShip = state !== "neutral";
  const isSafe = state.startsWith("ship-safe");
  const isHit = state.startsWith("ship-hit");
  const isSunk = state.startsWith("ship-sunk");

  // Get position (left/right/top/bottom/body)
  const getPosition = () => {
    if (state.endsWith("-left")) return "left";
    if (state.endsWith("-right")) return "right";
    if (state.endsWith("-top")) return "top";
    if (state.endsWith("-bottom")) return "bottom";
    if (state.endsWith("-body")) return "body";
    return null;
  };

  const position = getPosition();

  // Border color based on variant
  const getBorderColor = () => {
    if (isSafe) return "$secondary_500";
    if (isHit || isSunk) return "$destructive_500";
    return "transparent";
  };

  // Border radius based on position (rounded ends)
  const getBorderRadius = () => {
    if (!isShip || position === "body") {
      return {
        borderTopLeftRadius: RADIUS_SMALL,
        borderTopRightRadius: RADIUS_SMALL,
        borderBottomLeftRadius: RADIUS_SMALL,
        borderBottomRightRadius: RADIUS_SMALL,
      };
    }

    switch (position) {
      case "left":
        return {
          borderTopLeftRadius: RADIUS_ROUND,
          borderBottomLeftRadius: RADIUS_ROUND,
          borderTopRightRadius: RADIUS_SMALL,
          borderBottomRightRadius: RADIUS_SMALL,
        };
      case "right":
        return {
          borderTopLeftRadius: RADIUS_SMALL,
          borderBottomLeftRadius: RADIUS_SMALL,
          borderTopRightRadius: RADIUS_ROUND,
          borderBottomRightRadius: RADIUS_ROUND,
        };
      case "top":
        return {
          borderTopLeftRadius: RADIUS_ROUND,
          borderTopRightRadius: RADIUS_ROUND,
          borderBottomLeftRadius: RADIUS_SMALL,
          borderBottomRightRadius: RADIUS_SMALL,
        };
      case "bottom":
        return {
          borderTopLeftRadius: RADIUS_SMALL,
          borderTopRightRadius: RADIUS_SMALL,
          borderBottomLeftRadius: RADIUS_ROUND,
          borderBottomRightRadius: RADIUS_ROUND,
        };
      default:
        return {
          borderTopLeftRadius: RADIUS_SMALL,
          borderTopRightRadius: RADIUS_SMALL,
          borderBottomLeftRadius: RADIUS_SMALL,
          borderBottomRightRadius: RADIUS_SMALL,
        };
    }
  };

  // Whether to show hit marker (red dot)
  const showHitMarker = isHit || isSunk;

  // Background - sunk has no fill, others have neutral_800
  const backgroundColor = isSunk ? "transparent" : "$neutral_800";

  const borderRadiusStyles = getBorderRadius();

  return (
    <View
      width={CELL_SIZE}
      height={CELL_SIZE}
      backgroundColor={backgroundColor}
      borderWidth={isShip ? 1 : 0}
      borderColor={getBorderColor()}
      justifyContent="center"
      alignItems="center"
      position="relative"
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      {...borderRadiusStyles}
    >
      {/* Hit marker - red dot */}
      {showHitMarker && (
        <View
          width={8}
          height={8}
          borderRadius="$round"
          backgroundColor="$destructive_500"
        />
      )}

      {/* Neutral cell (no ship) - just dark background */}
      {!isShip && (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="$neutral_800"
          borderRadius={RADIUS_SMALL}
        />
      )}
    </View>
  );
}
