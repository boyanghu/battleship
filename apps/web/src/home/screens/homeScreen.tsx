"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { YStack } from "tamagui";
import { useMutation } from "convex/react";

import { api } from "@server/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { UTextButton } from "@/lib/components/core/button";
import useAnalytics from "@/lib/analytics/useAnalytics";

/**
 * Home screen - main landing page for Battleship.
 * Follows Assemble architecture: page wrapper delegates to this feature screen.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { Event } = useAnalytics();
  const createGame = useMutation(api.games.createGame);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // Memoized event builders to prevent unnecessary re-renders
  const engageButtonEvent = useMemo(
    () => Event().setProductName("Home").setComponentName("EngageEnemyButton"),
    [Event]
  );

  const trainingButtonEvent = useMemo(
    () => Event().setProductName("Home").setComponentName("TrainingMissionButton"),
    [Event]
  );

  const handleEngage = useCallback(async () => {
    if (!deviceId || creating) return;
    setCreating(true);
    try {
      const result = await createGame({ deviceId });
      router.push(`/lobby/${result.gameId}`);
    } finally {
      setCreating(false);
    }
  }, [deviceId, creating, createGame, router]);

  const handleTraining = useCallback(() => {
    // TODO: Implement training mission when backend ready
    router.push("/game/demo");
  }, [router]);

  return (
    <UPage>
      <YStack gap="$7" flex={1} justifyContent="center">
        {/* Header */}
        <YStack>
          <UText variant="hxl" color="$neutral_200">
            BATTLESHIP
          </UText>
          <UText variant="body-md" color="$neutral_400" marginTop="$2">
            Command your fleet. Outthink your enemy.
          </UText>
        </YStack>

        {/* Primary Actions */}
        <YStack gap="$4" marginTop="$6">
          <UTextButton
            text={creating ? "INITIALIZING..." : "ENGAGE ENEMY"}
            variant="glow"
            size="lg"
            fullWidth
            disabled={!deviceId || creating}
            onPress={handleEngage}
            eventBuilder={engageButtonEvent}
          />
          <UTextButton
            text="TRAINING MISSION"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={handleTraining}
            eventBuilder={trainingButtonEvent}
          />
        </YStack>
      </YStack>
    </UPage>
  );
}
