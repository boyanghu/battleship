"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { View, YStack } from "tamagui";
import { UPage } from "@/lib/components/core/layout";
import { UText } from "@/lib/components/core/text";
import useAnalytics from "@/lib/analytics/useAnalytics";
import { getOrCreateDeviceId } from "@/lib/device";
import {
  StatusHud,
  BattleLog,
  Battlefield,
  GuidanceStrip,
} from "../components";
import { useGameState } from "../hooks";
import { type Coordinate } from "../types";

interface GameScreenProps {
  gameId: string;
}

/**
 * Main game screen - the command console experience.
 * HUD overlay pattern with battlefield as primary surface.
 */
export default function GameScreen({ gameId }: GameScreenProps) {
  const { Event } = useAnalytics();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Initialize device ID
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // Game state from Convex
  const { state, isLoading, fireAt } = useGameState({ gameId, deviceId });

  // Event builder for guidance execute button
  const executeEventBuilder = useMemo(
    () => Event().setProductName("Game").setComponentName("GuidanceExecute"),
    [Event]
  );

  // Handle fire action from board click
  const handleFireAt = useCallback(
    (coordinate: Coordinate) => {
      fireAt(coordinate);
    },
    [fireAt]
  );

  // Handle guidance execute action
  const handleExecute = useCallback(() => {
    if (state?.guidance) {
      fireAt(state.guidance.coordinate);
    }
  }, [fireAt, state?.guidance]);

  // Loading state
  if (isLoading || !state) {
    return (
      <UPage>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <UText variant="h2" color="$neutral_400">
            Loading tactical systems...
          </UText>
        </YStack>
      </UPage>
    );
  }

  const isPlayerTurn = state.turn === "you";

  return (
    <View flex={1} backgroundColor="$bg" position="relative">
      {/* Status HUD - Top */}
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={10}
        paddingTop="$4"
      >
        <StatusHud
          phase={state.phase}
          turn={state.turn}
          timeRemaining={state.timeRemaining}
          enemyShipsRemaining={state.enemyShipsRemaining}
          playerShipsRemaining={state.playerShipsRemaining}
        />
      </View>

      {/* Battle Log - Left Side */}
      <View
        position="absolute"
        left="$4"
        top={80}
        bottom={100}
        zIndex={10}
      >
        <BattleLog entries={state.battleLog} />
      </View>

      {/* Battlefield - Center */}
      <View
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingTop={80}
        paddingBottom={100}
      >
        <Battlefield
          turn={state.turn}
          enemyBoard={state.enemyBoard}
          playerBoard={state.playerBoard}
          recommendedCell={state.guidance?.coordinate}
          onFireAt={handleFireAt}
        />
      </View>

      {/* Guidance Strip - Bottom (only on player's turn) */}
      {isPlayerTurn && state.guidance && (
        <View
          position="absolute"
          bottom="$6"
          left={0}
          right={0}
          zIndex={10}
        >
          <GuidanceStrip
            guidance={state.guidance}
            onExecute={handleExecute}
            eventBuilder={executeEventBuilder}
          />
        </View>
      )}
    </View>
  );
}
