"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { YStack } from "tamagui";
import { useMutation, useQuery } from "convex/react";
import { Check } from "@phosphor-icons/react";
import type { Id } from "convex/values";

import { api } from "@server/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import { UIconTextButton } from "@/lib/components/core/button";
import { PlayerStatus, ShareLinkBox } from "@/lib/components/lobby";
import useAnalytics from "@/lib/analytics/useAnalytics";

interface LobbyScreenProps {
  gameId: string;
}

/**
 * Lobby screen - waiting room for PvP games.
 * Shows player status, share link, and ready button.
 */
export default function LobbyScreen({ gameId }: LobbyScreenProps) {
  const router = useRouter();
  const { Event } = useAnalytics();
  const typedGameId = gameId as Id<"games">;

  // Convex queries and mutations
  const game = useQuery(api.games.getGame, { gameId: typedGameId });
  const joinGame = useMutation(api.games.joinGame);
  const setReady = useMutation(api.games.setReady);
  const startCountdownIfReady = useMutation(api.games.startCountdownIfReady);
  const advanceToPlacement = useMutation(api.games.advanceToPlacement);

  // Local state
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [localCountdown, setLocalCountdown] = useState<number | null>(null);
  const advancedRef = useRef(false);

  // Initialize device ID
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // Auto-join game when device ID is available
  useEffect(() => {
    if (!deviceId) return;
    joinGame({ gameId: typedGameId, deviceId });
  }, [deviceId, typedGameId, joinGame]);

  // Start countdown when all players are ready
  useEffect(() => {
    if (!game) return;
    const allReady =
      game.players.length >= 2 && game.players.every((player) => player.ready);
    if (game.status === "lobby" && allReady) {
      startCountdownIfReady({ gameId: typedGameId });
    }
  }, [game, typedGameId, startCountdownIfReady]);

  // Handle countdown timer
  useEffect(() => {
    if (!game?.countdownStartAt || game.status !== "countdown") {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - game.countdownStartAt!;
      const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000));
      setCountdown(remaining);
      if (remaining === 0 && !advancedRef.current) {
        advancedRef.current = true;
        if (deviceId) {
          advanceToPlacement({ gameId: typedGameId, deviceId });
        }
        router.push(`/game/${gameId}`);
      }
    };

    updateCountdown();
    const id = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(id);
  }, [advanceToPlacement, deviceId, game, typedGameId, gameId, router]);

  // Redirect if game has started
  useEffect(() => {
    if (!game) return;
    if (game.status === "placement" || game.status === "battle") {
      router.push(`/game/${gameId}`);
    }
  }, [game, gameId, router]);

  // Compute invite link
  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/lobby/${gameId}`;
  }, [gameId]);

  // Current player state
  const player = game?.players.find((p) => p.deviceId === deviceId);
  const isReady = player?.ready ?? false;
  const opponent = game?.players.find((p) => p.deviceId !== deviceId);

  // Event builders
  const copyButtonEvent = useMemo(
    () => Event().setProductName("Lobby").setComponentName("CopyLinkButton"),
    [Event]
  );

  const readyButtonEvent = useMemo(
    () => Event().setProductName("Lobby").setComponentName("ReadyButton"),
    [Event]
  );

  // Local countdown effect (for demo/testing without backend)
  useEffect(() => {
    if (localCountdown === null) return;

    if (localCountdown === 0) {
      // Navigate to game when countdown finishes
      router.push(`/game/${gameId}`);
      return;
    }

    const timer = setTimeout(() => {
      setLocalCountdown(localCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [localCountdown, gameId, router]);

  // Handlers
  const handleReady = useCallback(() => {
    if (!deviceId) return;
    
    // For demo: start local countdown when clicking READY
    // In production, this would be handled by the backend
    if (!isReady) {
      setLocalCountdown(5);
    } else {
      setLocalCountdown(null);
    }
    
    setReady({ gameId: typedGameId, deviceId, ready: !isReady });
  }, [deviceId, typedGameId, setReady, isReady]);

  // Determine player states
  const yourState = isReady ? "ready" : deviceId ? "connected" : "waiting";
  const opponentState = opponent
    ? opponent.ready
      ? "ready"
      : "connected"
    : "waiting";

  // Active countdown (local demo or from backend)
  const activeCountdown = localCountdown ?? countdown;

  // Show countdown overlay (matching Figma design)
  if (activeCountdown !== null && activeCountdown > 0) {
    return (
      <UPage>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$2">
          <UText variant="hxl" color="$neutral_200">
            {activeCountdown}
          </UText>
          <UText variant="label-md" color="$neutral_400">
            BATTLE BEGINS
          </UText>
        </YStack>
      </UPage>
    );
  }

  return (
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
        <ShareLinkBox url={inviteLink || "Loading..."} eventBuilder={copyButtonEvent} />

        {/* Player Status */}
        <YStack gap={10} alignItems="center">
          <PlayerStatus role="you" state={yourState} />
          <PlayerStatus role="opponent" state={opponentState} />

          {/* Ready Button */}
          <YStack paddingTop="$5" width={300}>
            <UIconTextButton
              text="READY"
              icon={<Check size={20} weight="regular" />}
              variant="glow"
              fullWidth
              disabled={!deviceId}
              onPress={handleReady}
              eventBuilder={readyButtonEvent}
            />
          </YStack>
        </YStack>
      </YStack>
    </UPage>
  );
}
