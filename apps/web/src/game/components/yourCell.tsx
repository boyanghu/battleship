"use client";

import { View } from "tamagui";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { type YourCellState } from "../types";

interface YourCellProps {
  state?: YourCellState;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onRotate?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  isPreview?: boolean;
  isEnemyHover?: boolean; // Enemy is hovering over this cell (PvP)
}

const CELL_SIZE = 32;

// Border radius values (from Figma)
const RADIUS_ROUND = 999;
const RADIUS_SMALL = 4;

/**
 * Your board cell - shows ships with rounded ends and hit markers.
 * Ship parts from Figma: left/right/top/bottom (rounded ends), body (all small radius)
 * Variants: safe (orange), hit (red + marker), sunk (red + marker, no fill)
 * Rotate variants (-rotate suffix): show rotate button for placement phase
 * Miss state: shows hollow circle for enemy shots that hit water
 */
export default function YourCell({
  state = "neutral",
  onHoverIn,
  onHoverOut,
  onRotate,
  onDragStart,
  isDragging = false,
  isPreview = false,
  isEnemyHover = false,
}: YourCellProps) {
  // Check for rotate variant
  const hasRotate = state.endsWith("-rotate");
  const baseState = hasRotate
    ? (state.replace("-rotate", "") as YourCellState)
    : state;

  // Check for miss state (enemy shot that hit water)
  const isMiss = baseState === "miss";

  // Parse state into parts
  const isShip = baseState !== "neutral" && !isMiss;
  const isSafe = baseState.startsWith("ship-safe");
  const isHit = baseState.startsWith("ship-hit");
  const isSunk = baseState.startsWith("ship-sunk");

  // Get position (left/right/top/bottom/body)
  const getPosition = () => {
    if (baseState.endsWith("-left")) return "left";
    if (baseState.endsWith("-right")) return "right";
    if (baseState.endsWith("-top")) return "top";
    if (baseState.endsWith("-bottom")) return "bottom";
    if (baseState.endsWith("-body")) return "body";
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

  // Cursor style for draggable ship cells
  const cursorStyle = isShip && onDragStart ? "grab" : undefined;

  // Opacity for dragging state
  const opacity = isDragging ? 0.5 : isPreview ? 0.7 : 1;

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
      onMouseDown={isShip && onDragStart ? onDragStart : undefined}
      cursor={cursorStyle}
      opacity={opacity}
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

      {/* Miss marker - white hollow circle (enemy shot that missed) */}
      {isMiss && (
        <View
          width={8}
          height={8}
          borderRadius="$round"
          borderWidth={2}
          borderColor="$neutral_400"
          backgroundColor="transparent"
        />
      )}

      {/* Neutral cell (no ship) - just dark background */}
      {!isShip && !isMiss && (
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

      {/* Rotate button for placement phase - centered, light background per Figma */}
      {hasRotate && onRotate && (
        <View
          position="absolute"
          top={8}
          left={8}
          right={8}
          height={16}
          borderRadius="$round"
          backgroundColor="$neutral_200"
          justifyContent="center"
          alignItems="center"
          cursor="pointer"
          onPress={onRotate}
          hoverStyle={{ backgroundColor: "$neutral_300" }}
          pressStyle={{ backgroundColor: "$neutral_400" }}
        >
          <ArrowsClockwise size={12} weight="regular" color="#141a23" />
        </View>
      )}

      {/* Enemy hover indicator - primary target (PvP only) */}
      {isEnemyHover && (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
        >
          {/* Outer ring */}
          <View
            position="absolute"
            width={28}
            height={28}
            borderRadius="$round"
            borderWidth={2}
            borderColor="$primary_500"
            opacity={0.6}
          />
          {/* Inner crosshair */}
          <View
            width={12}
            height={12}
            borderRadius="$round"
            borderWidth={2}
            borderColor="$primary_500"
            backgroundColor="transparent"
          />
        </View>
      )}
    </View>
  );
}
