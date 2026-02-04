"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { YStack } from "tamagui";
import { useMutation } from "convex/react";
import { Crosshair, Robot } from "@phosphor-icons/react";

import { api } from "@server/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { UIconTextButton } from "@/lib/components/core/button";
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
    () => Event().setProductName("Home").setComponentName("TrainingSessionButton"),
    [Event]
  );

  const handleEngage = useCallback(async () => {
    if (!deviceId || creating) return;
    setCreating(true);
    try {
      const result = await createGame({ deviceId, mode: "pvp" });
      router.push(`/game/${result.gameId}`);
    } finally {
      setCreating(false);
    }
  }, [deviceId, creating, createGame, router]);

  const handleTraining = useCallback(async () => {
    if (!deviceId || creating) return;
    setCreating(true);
    try {
      const result = await createGame({ deviceId, mode: "pve" });
      router.push(`/game/${result.gameId}`);
    } finally {
      setCreating(false);
    }
  }, [deviceId, creating, createGame, router]);

  return (
    <UPage>
      <YStack flex={1} justifyContent="center" alignItems="center">
        {/* Header */}
        <YStack alignItems="center">
          <UText variant="hxl" color="$neutral_200">
            BATTLESHIP
          </UText>
          <UText variant="h4" color="$neutral_400" marginTop="$2">
            Command your fleet. Outthink your enemy.
          </UText>
        </YStack>

        {/* Primary Actions */}
        <YStack gap="$5" marginTop="$9" alignItems="center">
          <UIconTextButton
            text={creating ? "INITIALIZING..." : "ENGAGE ENEMY"}
            icon={<Crosshair size={20} weight="regular" />}
            variant="glow"
            disabled={!deviceId || creating}
            onPress={handleEngage}
            eventBuilder={engageButtonEvent}
          />
          <UIconTextButton
            text="TRAINING SESSION"
            icon={<Robot size={20} weight="regular" />}
            variant="secondary"
            disabled={!deviceId || creating}
            onPress={handleTraining}
            eventBuilder={trainingButtonEvent}
          />
        </YStack>
      </YStack>
    </UPage>
  );
}
