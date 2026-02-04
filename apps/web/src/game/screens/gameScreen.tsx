"use client";

import { useEffect, useState } from "react";
import { View } from "tamagui";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@server/_generated/dataModel";

import { api } from "@server/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import { UText } from "@/lib/components/core/text";
import {
  LobbyPhase,
  CountdownPhase,
  PlacementPhase,
  BattlePhase,
  FinishedPhase,
} from "../components";

interface GameScreenProps {
  gameId: string;
}

/**
 * Game screen - phase router that renders the appropriate UI
 * based on the current game status.
 *
 * Phases: lobby → countdown → placement → battle → finished
 */
export default function GameScreen({ gameId }: GameScreenProps) {
  const typedGameId = gameId as Id<"games">;
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Initialize device ID
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // Fetch game state (skip until deviceId is available)
  const game = useQuery(
    api.games.getGame,
    deviceId ? { gameId: typedGameId, deviceId } : "skip"
  );
  const joinGame = useMutation(api.games.joinGame);

  // Auto-join game when device ID is available
  useEffect(() => {
    if (!deviceId) return;
    joinGame({ gameId: typedGameId, deviceId });
  }, [deviceId, typedGameId, joinGame]);

  // Loading state
  if (!game || !deviceId) {
    return (
      <View
        flex={1}
        backgroundColor="$bg"
        justifyContent="center"
        alignItems="center"
      >
        <UText variant="h2" color="$neutral_400">
          Loading...
        </UText>
      </View>
    );
  }

  // Route to appropriate phase component
  switch (game.status) {
    case "lobby":
      return (
        <LobbyPhase gameId={gameId} deviceId={deviceId} game={game} />
      );

    case "countdown":
      return (
        <CountdownPhase gameId={gameId} deviceId={deviceId} game={game} />
      );

    case "placement":
      return (
        <PlacementPhase gameId={gameId} deviceId={deviceId} game={game} />
      );

    case "battle":
      return <BattlePhase gameId={gameId} deviceId={deviceId} />;

    case "finished":
      return (
        <FinishedPhase gameId={gameId} deviceId={deviceId} game={game} />
      );

    default:
      return (
        <View
          flex={1}
          backgroundColor="$bg"
          justifyContent="center"
          alignItems="center"
        >
          <UText variant="h2" color="$destructive_500">
            Unknown game state
          </UText>
        </View>
      );
  }
}
