"use client";

import { useEffect, useState, useRef } from "react";
import { YStack, View } from "tamagui";
import { useMutation } from "convex/react";
import type { Id } from "@server/_generated/dataModel";

import { api } from "@server/_generated/api";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { FadeTransition } from "@/lib/components/core/transitions";

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
    <FadeTransition>
      <UPage>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
          {/* Countdown number with fade animation on each change */}
          <View
            key={showGo ? "go" : countdown}
            style={{
              animation: "countdownFade 800ms ease-out",
            } as React.CSSProperties}
          >
            <UText variant="hxl" color="$neutral_200">
              {showGo ? "GO!" : countdown ?? "..."}
            </UText>
          </View>
          <UText variant="label-md" color="$neutral_400">
            BATTLE BEGINS
          </UText>
        </YStack>

        {/* Keyframes for countdown number animation */}
        <style jsx global>{`
          @keyframes countdownFade {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            20% {
              opacity: 1;
              transform: scale(1.05);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </UPage>
    </FadeTransition>
  );
}
