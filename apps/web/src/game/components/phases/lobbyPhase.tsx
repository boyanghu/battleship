"use client";

import { useMemo, useCallback } from "react";
import { YStack } from "tamagui";
import { useMutation } from "convex/react";
import { Check } from "@phosphor-icons/react";
import type { Id } from "@server/_generated/dataModel";

import { api } from "@server/_generated/api";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { UIconTextButton } from "@/lib/components/core/button";
import { FadeTransition } from "@/lib/components/core/transitions";
import { PlayerStatus, ShareLinkBox } from "@/lib/components/lobby";
import useAnalytics from "@/lib/analytics/useAnalytics";

interface LobbyPhaseProps {
  gameId: string;
  deviceId: string;
  game: {
    players: Array<{ deviceId: string; ready: boolean }>;
  };
}

/**
 * Lobby phase - waiting room for PvP games.
 * Shows player status, share link, and ready button.
 */
export default function LobbyPhase({ gameId, deviceId, game }: LobbyPhaseProps) {
  const { Event } = useAnalytics();
  const typedGameId = gameId as Id<"games">;

  // Mutations
  const setReady = useMutation(api.games.setReady);

  // Compute invite link
  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/game/${gameId}`;
  }, [gameId]);

  // Current player state
  const player = game.players.find((p) => p.deviceId === deviceId);
  const isReady = player?.ready ?? false;
  const opponent = game.players.find((p) => p.deviceId !== deviceId);

  // Event builders
  const copyButtonEvent = useMemo(
    () => Event().setProductName("Lobby").setComponentName("CopyLinkButton"),
    [Event]
  );

  const readyButtonEvent = useMemo(
    () => Event().setProductName("Lobby").setComponentName("ReadyButton"),
    [Event]
  );

  // Handler
  const handleReady = useCallback(() => {
    setReady({ gameId: typedGameId, deviceId, ready: !isReady });
  }, [typedGameId, deviceId, setReady, isReady]);

  // Determine player states
  const yourState = isReady ? "ready" : "connected";
  const opponentState = opponent
    ? opponent.ready
      ? "ready"
      : "connected"
    : "waiting";

  return (
    <FadeTransition>
      <UPage>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$7">
          {/* Header */}
          <YStack alignItems="center" gap="$2">
            <UText variant="h1" color="$neutral_200">
              AWAITING ENEMY
            </UText>
            <UText variant="body-md" color="$neutral_400">
              Share this link to invite an opponent
            </UText>
          </YStack>

          {/* Share Link */}
          <ShareLinkBox
            url={inviteLink || "Loading..."}
            eventBuilder={copyButtonEvent}
          />

          {/* Player Status */}
          <YStack gap={10} alignItems="center">
            <PlayerStatus role="you" state={yourState} />
            <PlayerStatus role="opponent" state={opponentState} />

            {/* Ready Button */}
            <YStack paddingTop="$5" width={300}>
              <UIconTextButton
                text={isReady ? "WAITING..." : "READY"}
                icon={<Check size={20} weight="regular" />}
                variant="glow"
                fullWidth
                onPress={handleReady}
                eventBuilder={readyButtonEvent}
              />
            </YStack>
          </YStack>
        </YStack>
      </UPage>
    </FadeTransition>
  );
}
