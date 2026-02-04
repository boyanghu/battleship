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

/**
 * Top status bar showing game phase, turn, timer, and ships remaining.
 * Design: [ENEMY X] | PHASE | TURN | TIMER | [YOU X]
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
    <XStack
      justifyContent="center"
      alignItems="center"
      gap="$4"
      paddingVertical="$3"
    >
      {/* Enemy ships badge */}
      <View
        backgroundColor="$primary_600"
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderRadius="$round"
      >
        <XStack gap="$2" alignItems="center">
          <UText variant="label-md" color="$neutral_200">
            ENEMY
          </UText>
          <UText variant="label-md" color="$neutral_200">
            {enemyShipsRemaining}
          </UText>
        </XStack>
      </View>

      {/* Center status group */}
      <XStack alignItems="center" gap="$3">
        {/* Phase */}
        <UText variant="label-md" color="$neutral_400">
          {phaseText}
        </UText>

        {/* Turn indicator */}
        <UText variant="h3" color={turnColor}>
          {turnText}
        </UText>

        {/* Timer */}
        <UText variant="label-md" color="$neutral_200">
          {formatTime(timeRemaining)}
        </UText>
      </XStack>

      {/* Player ships badge */}
      <View
        backgroundColor="$secondary_600"
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderRadius="$round"
      >
        <XStack gap="$2" alignItems="center">
          <UText variant="label-md" color="$neutral_200">
            YOU
          </UText>
          <UText variant="label-md" color="$neutral_200">
            {playerShipsRemaining}
          </UText>
        </XStack>
      </View>
    </XStack>
  );
}
