"use client";

import { View, XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { type GamePhase, type TurnOwner } from "../types";

interface StatusHudProps {
  phase: GamePhase;
  turn: TurnOwner;
  timeRemaining: number;
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
 * Layout from Figma: [ENEMY X] | PHASE | YOUR TURN | TIMER | [YOU X]
 */
export default function StatusHud({
  phase,
  turn,
  timeRemaining,
  enemyShipsRemaining,
  playerShipsRemaining,
}: StatusHudProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Phase display text
  const phaseText = phase.toUpperCase();

  // Turn display
  const turnText = turn === "you" ? "YOUR TURN" : "ENEMY TURN";
  const turnColor = turn === "you" ? "$secondary_500" : "$primary_500";

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

          {/* Turn indicator */}
          <UText variant="h2" color={turnColor}>
            {turnText}
          </UText>

          {/* Timer */}
          <View width={80}>
            <UText variant="label-lg" color="$neutral_200" textAlign="right">
              {formatTime(timeRemaining)}
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
