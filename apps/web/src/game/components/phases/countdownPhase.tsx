"use client";

import { useEffect, useState, useRef } from "react";
import { YStack } from "tamagui";
import { useMutation } from "convex/react";
import type { Id } from "convex/values";

import { api } from "@server/_generated/api";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";

interface CountdownPhaseProps {
  gameId: string;
  deviceId: string;
  game: {
    countdownStartedAt?: number;
    countdownDurationMs?: number;
  };
}

/**
 * Countdown phase - 5-4-3-2-1 before battle begins.
 * Auto-advances to placement when countdown expires.
 */
export default function CountdownPhase({
  gameId,
  deviceId,
  game,
}: CountdownPhaseProps) {
  const typedGameId = gameId as Id<"games">;
  const advanceFromCountdown = useMutation(api.games.advanceFromCountdown);
  const advancedRef = useRef(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGo, setShowGo] = useState(false);

  // Handle countdown timer
  useEffect(() => {
    if (!game.countdownStartedAt || !game.countdownDurationMs) {
      return;
    }

    const updateCountdown = () => {
      // Calculate remaining time: endTime - now
      const endTime = game.countdownStartedAt! + game.countdownDurationMs!;
      const remainingMs = Math.max(0, endTime - Date.now());
      const remaining = Math.ceil(remainingMs / 1000);

      setCountdown(remaining);

      if (remaining === 0 && !advancedRef.current) {
        advancedRef.current = true;
        setShowGo(true);
        // Server will advance to placement phase
        advanceFromCountdown({ gameId: typedGameId });
      }
    };

    updateCountdown();
    const id = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(id);
  }, [game.countdownStartedAt, game.countdownDurationMs, typedGameId, advanceFromCountdown]);

  return (
    <UPage>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
        <UText variant="hxl" color="$neutral_200">
          {showGo ? "GO!" : countdown ?? "..."}
        </UText>
        <UText variant="label-md" color="$neutral_400">
          BATTLE BEGINS
        </UText>
      </YStack>
    </UPage>
  );
}
