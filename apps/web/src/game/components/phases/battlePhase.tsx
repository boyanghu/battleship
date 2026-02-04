"use client";

import { useCallback, useMemo } from "react";
import { View } from "tamagui";
import { UText } from "@/lib/components/core/text";
import useAnalytics from "@/lib/analytics/useAnalytics";
import {
  StatusHud,
  BattleLog,
  Battlefield,
  GuidanceStrip,
} from "../index";
import { useGameState } from "../../hooks";
import { type Coordinate } from "../../types";

interface BattlePhaseProps {
  gameId: string;
  deviceId: string;
}

/**
 * Battle phase - the main command console experience.
 * HUD overlay pattern with battlefield as primary surface.
 */
export default function BattlePhase({ gameId, deviceId }: BattlePhaseProps) {
  const { Event } = useAnalytics();

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
      <View
        flex={1}
        backgroundColor="$bg"
        justifyContent="center"
        alignItems="center"
      >
        <UText variant="h2" color="$neutral_400">
          Loading tactical systems...
        </UText>
      </View>
    );
  }

  const isPlayerTurn = state.turn === "you";

  return (
    <View flex={1} backgroundColor="$bg" position="relative">
      {/* Status HUD - Top */}
      <View position="absolute" top={31} left={0} right={0} zIndex={10}>
        <StatusHud
          phase={state.phase}
          turn={state.turn}
          timeRemaining={state.timeRemaining}
          enemyShipsRemaining={state.enemyShipsRemaining}
          playerShipsRemaining={state.playerShipsRemaining}
        />
      </View>

      {/* Battle Log - Left Side, Vertically Centered */}
      <View
        position="absolute"
        left={31}
        top="50%"
        zIndex={10}
        // @ts-expect-error - transform for vertical centering
        style={{ transform: "translateY(-50%)" }}
      >
        <BattleLog entries={state.battleLog} />
      </View>

      {/* Battlefield - Center */}
      <View flex={1} justifyContent="center" alignItems="center">
        <Battlefield
          turn={state.turn}
          enemyCells={state.enemyCells}
          yourCells={state.yourCells}
          recommendedCell={state.guidance?.coordinate}
          onFireAt={handleFireAt}
        />
      </View>

      {/* Guidance Strip - Bottom (only on player's turn) */}
      {isPlayerTurn && state.guidance && (
        <View
          position="absolute"
          bottom={31}
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
