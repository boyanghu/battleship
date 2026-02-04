"use client";

import { useCallback, useMemo } from "react";
import { View, YStack } from "tamagui";
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
 *
 * Board focus rules:
 * - When my turn: enemy board highlighted, interactive; my board de-emphasized
 * - When enemy turn: my board highlighted; enemy board de-emphasized, non-interactive
 * - When finished: both boards de-emphasized, non-interactive
 */
export default function BattlePhase({ gameId, deviceId }: BattlePhaseProps) {
  const { Event } = useAnalytics();

  // Game state from Convex
  const { state, isLoading, isFiring, fireAt } = useGameState({ gameId, deviceId });

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
  const isFinished = state.phase === "finished";

  // Disable interactions when firing (waiting for resolution) or game finished
  const isDisabled = isFiring || isFinished;

  return (
    <View flex={1} backgroundColor="$bg" position="relative">
      {/* Status HUD - Top */}
      <View position="absolute" top={31} left={0} right={0} zIndex={10}>
        <StatusHud
          phase={state.phase}
          turn={state.turn}
          timeRemainingMs={state.timeRemainingMs}
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
          disabled={isDisabled}
          isFinished={isFinished}
        />
      </View>

      {/* Guidance Strip - Bottom (only on player's turn when not finished) */}
      {isPlayerTurn && state.guidance && !isFinished && (
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

      {/* End State Overlay */}
      {isFinished && (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          zIndex={20}
          // @ts-expect-error - style prop for overlay
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        >
          <YStack alignItems="center" gap="$4">
            <UText variant="hxl" color="$neutral_200">
              BATTLE COMPLETE
            </UText>
            <UText variant="h2" color="$neutral_400">
              {/* Winner will be determined from game state */}
              Game Over
            </UText>
          </YStack>
        </View>
      )}
    </View>
  );
}
