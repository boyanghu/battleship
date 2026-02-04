"use client";

import { View, XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { type GamePhase, type TurnOwner } from "../types";

interface StatusHudProps {
  phase: GamePhase;
  turn: TurnOwner;
  timeRemainingMs: number;
  enemyShipsRemaining: number;
  playerShipsRemaining: number;
}

// Glass effect styles (from Figma)
const glassStyle = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(26, 33, 48, 0.5)",
};

/**
 * Top status bar with glass effect.
 * Layout from Figma: [ENEMY X] | PHASE | CENTER TEXT | TIMER | [YOU X]
 * Center text shows "POSITION YOUR FLEET" during placement, turn indicator otherwise.
 */
export default function StatusHud({
  phase,
  turn,
  timeRemainingMs,
  enemyShipsRemaining,
  playerShipsRemaining,
}: StatusHudProps) {
  // Format time based on remaining time
  // Above 5s: MM:SS format
  // Below 5s: X.X format (deciseconds)
  const formatTime = (ms: number) => {
    if (ms <= 5000) {
      // Below 5 seconds: show X.X format
      return (ms / 1000).toFixed(1);
    }
    // Above 5 seconds: MM:SS format
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer color: red when below 5 seconds
  const timerColor = timeRemainingMs <= 5000 ? "$destructive_500" : "$neutral_200";

  // Phase display text
  const phaseText = phase.toUpperCase();

  // Center text: phase-aware
  const getCenterText = () => {
    if (phase === "placement") {
      return "POSITION YOUR FLEET";
    }
    return turn === "you" ? "YOUR TURN" : "ENEMY TURN";
  };

  const centerText = getCenterText();
  const centerColor = phase === "placement"
    ? "$secondary_500"
    : turn === "you"
      ? "$secondary_500"
      : "$primary_500";

  return (
    <XStack justifyContent="center" alignItems="center" gap="$3">
      {/* Enemy ships badge */}
      <View
        paddingHorizontal="$6"
        paddingVertical="$3"
        borderRadius={14}
        // @ts-expect-error - style prop for glass effect
        style={glassStyle}
      >
        <XStack gap="$2" alignItems="center">
          <UText variant="label-sm" color="$primary_500">
            ENEMY
          </UText>
          <UText variant="label-lg" color="$neutral_200">
            {enemyShipsRemaining}
          </UText>
        </XStack>
      </View>

      {/* Center status container */}
      <View
        paddingHorizontal="$6"
        paddingVertical="$2"
        borderRadius={14}
        width={480}
        // @ts-expect-error - style prop for glass effect
        style={glassStyle}
      >
        <XStack justifyContent="space-between" alignItems="center">
          {/* Phase */}
          <View width={80}>
            <UText variant="label-md" color="$neutral_400">
              {phaseText}
            </UText>
          </View>

          {/* Center text - phase-aware */}
          <UText variant="h2" color={centerColor}>
            {centerText}
          </UText>

          {/* Timer - red when below 5 seconds */}
          <View width={80}>
            <UText variant="label-lg" color={timerColor} textAlign="right">
              {formatTime(timeRemainingMs)}
            </UText>
          </View>
        </XStack>
      </View>

      {/* Player ships badge */}
      <View
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius={14}
        width={100}
        // @ts-expect-error - style prop for glass effect
        style={glassStyle}
      >
        <XStack gap="$2" alignItems="center" justifyContent="center">
          <UText variant="label-sm" color="$secondary_500">
            You
          </UText>
          <UText variant="label-lg" color="$neutral_200">
            {playerShipsRemaining}
          </UText>
        </XStack>
      </View>
    </XStack>
  );
}
