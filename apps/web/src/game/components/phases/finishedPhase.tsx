"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { YStack } from "tamagui";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { UIconTextButton } from "@/lib/components/core/button";
import { House } from "@phosphor-icons/react";
import useAnalytics from "@/lib/analytics/useAnalytics";

interface FinishedPhaseProps {
  gameId: string;
  deviceId: string;
  game: {
    winnerDeviceId?: string;
  };
}

/**
 * Finished phase - game over screen.
 * Shows win/lose state and option to play again.
 */
export default function FinishedPhase({
  gameId,
  deviceId,
  game,
}: FinishedPhaseProps) {
  const router = useRouter();
  const { Event } = useAnalytics();

  const isWinner = game.winnerDeviceId === deviceId;

  const handlePlayAgain = useCallback(() => {
    router.push("/");
  }, [router]);

  const playAgainEvent = Event()
    .setProductName("Game")
    .setComponentName("PlayAgainButton");

  return (
    <UPage>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$6">
        <YStack alignItems="center" gap="$2">
          <UText
            variant="hxl"
            color={isWinner ? "$success_500" : "$destructive_500"}
          >
            {isWinner ? "VICTORY" : "DEFEAT"}
          </UText>
          <UText variant="body-md" color="$neutral_400">
            {isWinner
              ? "Enemy fleet destroyed. Well played, Commander."
              : "Your fleet has been sunk. Better luck next time."}
          </UText>
        </YStack>

        <UIconTextButton
          text="RETURN TO BASE"
          icon={<House size={20} weight="regular" />}
          variant="secondary"
          onPress={handlePlayAgain}
          eventBuilder={playAgainEvent}
        />
      </YStack>
    </UPage>
  );
}
