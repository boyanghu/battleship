"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Text, XStack, YStack } from "tamagui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@server/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import { getVariantStyle } from "@/lib/typography";
import type { Id } from "convex/values";

interface LobbyPageProps {
  params: { gameId: string };
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const router = useRouter();
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.games.getGame, { gameId });
  const joinGame = useMutation(api.games.joinGame);
  const setReady = useMutation(api.games.setReady);
  const startCountdownIfReady = useMutation(api.games.startCountdownIfReady);
  const advanceToPlacement = useMutation(api.games.advanceToPlacement);

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const advancedRef = useRef(false);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    joinGame({ gameId, deviceId });
  }, [deviceId, gameId, joinGame]);

  useEffect(() => {
    if (!game) return;
    const allReady =
      game.players.length >= 2 && game.players.every((player) => player.ready);
    if (game.status === "lobby" && allReady) {
      startCountdownIfReady({ gameId });
    }
  }, [game, gameId, startCountdownIfReady]);

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
          advanceToPlacement({ gameId, deviceId });
        }
        router.push(`/game/${gameId}`);
      }
    };

    updateCountdown();
    const id = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(id);
  }, [advanceToPlacement, deviceId, game, gameId, router]);

  useEffect(() => {
    if (!game) return;
    if (game.status === "placement" || game.status === "battle") {
      router.push(`/game/${gameId}`);
    }
  }, [game, gameId, router]);

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/lobby/${gameId}`;
  }, [gameId]);

  const player = game?.players.find((p) => p.deviceId === deviceId);
  const isReady = player?.ready ?? false;

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <YStack
      flex={1}
      minHeight="100vh"
      bg="$bg"
      px="$space_6"
      py="$space_6"
      gap="$space_5"
    >
      <YStack gap="$space_2">
        <Text style={getVariantStyle("display")}>Lobby</Text>
        <Text style={getVariantStyle("body")} color="$muted">
          Awaiting opponent. Share the link and ready up.
        </Text>
      </YStack>

      <YStack gap="$space_3">
        <Text style={getVariantStyle("label")} color="$muted">
          Invite Link
        </Text>
        <XStack
          gap="$space_2"
          alignItems="center"
          justifyContent="space-between"
          borderRadius="$radius_2"
          borderColor="$border"
          borderWidth={1}
          px="$space_4"
          py="$space_3"
        >
          <Text style={getVariantStyle("body")} flex={1} color="$text">
            {inviteLink || "Loading link..."}
          </Text>
          <Button
            onPress={handleCopy}
            bg="$bgAlt"
            color="$text"
            borderRadius="$radius_2"
            px="$space_3"
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </XStack>
      </YStack>

      <YStack gap="$space_2">
        <Text style={getVariantStyle("label")} color="$muted">
          Status
        </Text>
        <Text style={getVariantStyle("body")}>
          Players: {game?.players.length ?? 0}/2
        </Text>
        <Text style={getVariantStyle("body")}>
          Phase: {game?.status ?? "loading"}
        </Text>
      </YStack>

      <Button
        onPress={() => {
          if (!deviceId) return;
          setReady({ gameId, deviceId, ready: !isReady });
        }}
        bg={isReady ? "$accent" : "$bgAlt"}
        color={isReady ? "$bg" : "$text"}
        borderRadius="$radius_3"
        px="$space_5"
        py="$space_3"
      >
        {isReady ? "Ready ✓" : "Ready Up"}
      </Button>

      {game?.status === "countdown" && countdown !== null ? (
        <YStack gap="$space_2">
          <Text style={getVariantStyle("label")} color="$muted">
            Countdown
          </Text>
          <Text style={getVariantStyle("display")}>{countdown}</Text>
        </YStack>
      ) : null}
    </YStack>
  );
}
