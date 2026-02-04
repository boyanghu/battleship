"use client";

import { YStack } from "tamagui";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";

interface PlacementPhaseProps {
  gameId: string;
  deviceId: string;
  game: {
    placementStartedAt?: number;
    placementDurationMs?: number;
  };
}

/**
 * Placement phase - position your fleet before battle.
 * TODO: Implement ship placement UI with drag-and-drop.
 */
export default function PlacementPhase({
  gameId,
  deviceId,
  game,
}: PlacementPhaseProps) {
  return (
    <UPage>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <UText variant="h1" color="$neutral_200">
          POSITION YOUR FLEET
        </UText>
        <UText variant="body-md" color="$neutral_400">
          Ship placement coming soon...
        </UText>
        <UText variant="label-sm" color="$neutral_500">
          Game ID: {gameId}
        </UText>
      </YStack>
    </UPage>
  );
}
