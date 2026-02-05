"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import useAnalytics from "@/lib/analytics/useAnalytics";
import { MAX_TIMEOUTS } from "@server/lib/constants";
import {
  StatusHud,
  BattleLog,
  Battlefield,
  GuidanceStrip,
  PlayerStatusSidebar,
} from "../index";
import { type EffectInstance } from "../effects";
import { useGameState, useThrottledHover } from "../../hooks";
import { type Coordinate } from "../../types";
import { stringToCoord } from "../../utils";
import type { Id } from "@server/_generated/dataModel";

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
  const {
    state,
    isLoading,
    isFiring,
    fireAt,
    lastOutcome,
    lastEnemyShot,
    timeRemainingMs,
  } = useGameState({ gameId, deviceId });

  // Effect system state - tracks active plume effects on both boards
  const [effects, setEffects] = useState<EffectInstance[]>([]);
  const processedOutcomeRef = useRef<string | null>(null);
  const processedEnemyShotRef = useRef<string | null>(null);

  // Spawn effect for my shot (on enemy board)
  useEffect(() => {
    if (!lastOutcome) return;

    // Create unique key for this outcome to prevent duplicates
    const outcomeKey = `${lastOutcome.coordinate}-${lastOutcome.result}-${Date.now()}`;
    if (processedOutcomeRef.current === `${lastOutcome.coordinate}-${lastOutcome.result}`) return;
    processedOutcomeRef.current = `${lastOutcome.coordinate}-${lastOutcome.result}`;

    const variant = lastOutcome.result === "miss" ? "miss" : "hitEnemy";
    const effect: EffectInstance = {
      id: `my-${outcomeKey}`,
      coord: lastOutcome.coordinate,
      variant,
      createdAt: Date.now(),
    };

    setEffects((prev) => [...prev, effect]);
  }, [lastOutcome]);

  // Spawn effect for enemy shot (on my board)
  useEffect(() => {
    if (!lastEnemyShot) return;

    // Create unique key for this shot to prevent duplicates
    const shotKey = `${lastEnemyShot.coordinate}-${lastEnemyShot.result}`;
    if (processedEnemyShotRef.current === shotKey) return;
    processedEnemyShotRef.current = shotKey;

    const variant = lastEnemyShot.result === "miss" ? "miss" : "hitMe";
    const effect: EffectInstance = {
      id: `enemy-${shotKey}-${Date.now()}`,
      coord: lastEnemyShot.coordinate,
      variant,
      createdAt: Date.now(),
    };

    setEffects((prev) => [...prev, effect]);
  }, [lastEnemyShot]);

  // Handle effect completion - remove from state
  const handleEffectComplete = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Throttled hover for real-time enemy hover visualization (PvP)
  const { updateHover, clearHover } = useThrottledHover({
    gameId: gameId as Id<"games">,
    deviceId,
    isMyTurn: state?.turn === "you",
    phase: state?.phase ?? "",
  });

  // Event builder for guidance execute button
  const executeEventBuilder = useMemo(
    () => Event().setProductName("Game").setComponentName("GuidanceExecute"),
    [Event]
  );

  // Handle fire action from board click
  const handleFireAt = useCallback(
    (coordinate: Coordinate) => {
      Event()
        .setProductName("Game")
        .setComponentName("FireShot")
        .setAction("Attempt")
        .setProperties({ source: "board", coordinate })
        .log();
      fireAt(coordinate);
    },
    [Event, fireAt]
  );

  // Handle cell hover for real-time enemy hover visualization (PvP)
  const handleCellHover = useCallback(
    (coordinate: Coordinate | null) => {
      if (coordinate) {
        updateHover(stringToCoord(coordinate));
      } else {
        clearHover();
      }
    },
    [updateHover, clearHover]
  );

  // Handle guidance execute action
  const handleExecute = useCallback(() => {
    if (state?.guidance) {
      Event()
        .setProductName("Game")
        .setComponentName("FireShot")
        .setAction("Attempt")
        .setProperties({ source: "guidance", coordinate: state.guidance.coordinate })
        .log();
      fireAt(state.guidance.coordinate);
    }
  }, [Event, fireAt, state?.guidance]);

  // Log shot outcomes for analytics
  useEffect(() => {
    if (!lastOutcome) return;
    Event()
      .setProductName("Game")
      .setComponentName("ShotResolved")
      .setAction("Success")
      .setProperties({
        coordinate: lastOutcome.coordinate,
        result: lastOutcome.result,
        shipName: lastOutcome.shipName ?? null,
      })
      .log();
  }, [Event, lastOutcome]);

  // Split effects by board (must be before early return to satisfy hooks rules)
  // - Enemy board effects: my shots (hitEnemy, miss on enemy board)
  // - Your board effects: enemy shots (hitMe, miss on my board)
  const enemyBoardEffects = useMemo(
    () => effects.filter((e) => (e.variant === "miss" && e.id.startsWith("my-")) || e.variant === "hitEnemy"),
    [effects]
  );
  const yourBoardEffects = useMemo(
    () => effects.filter((e) => (e.variant === "miss" && e.id.startsWith("enemy-")) || e.variant === "hitMe"),
    [effects]
  );

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
    <View flex={1} backgroundColor="$bg" position="relative" overflow="hidden">
      {/* Status HUD - Top */}
      <View position="absolute" top={31} left={0} right={0} zIndex={10}>
        <StatusHud
          phase={state.phase}
          turn={state.turn}
          timeRemainingMs={timeRemainingMs}
        />
      </View>

      {/* Battle Log - Left Side, Vertically Centered */}
      <View
        position="absolute"
        left={31}
        top="50%"
        zIndex={10}
        style={{ transform: "translateY(-50%)" } as React.CSSProperties}
      >
        <BattleLog entries={state.battleLog} />
      </View>

      {/* Player Status Sidebar - Right Side, Vertically Centered */}
      <View
        position="absolute"
        right={31}
        top="50%"
        zIndex={10}
        style={{ transform: "translateY(-50%)" } as React.CSSProperties}
      >
        <PlayerStatusSidebar
          playerShipsHealth={state.playerShipsHealth}
          enemySunkShips={state.enemySunkShips}
          playerTimeoutCount={state.playerTimeoutCount}
          enemyTimeoutCount={state.enemyTimeoutCount}
          maxTimeouts={MAX_TIMEOUTS}
        />
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
          enemyHoverCoord={state.enemyHoverCoord}
          onCellHover={handleCellHover}
          enemyBoardEffects={enemyBoardEffects}
          yourBoardEffects={yourBoardEffects}
          onEffectComplete={handleEffectComplete}
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
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" } as React.CSSProperties}
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
