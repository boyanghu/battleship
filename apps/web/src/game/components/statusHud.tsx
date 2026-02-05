"use client";

import { View, XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { glassEffectStyle } from "@/lib/styles";
import { useErrorGlowAnimation } from "@/lib/styles/glowAnimation";
import { type GamePhase, type TurnOwner } from "../types";

interface StatusHudProps {
  phase: GamePhase;
  turn: TurnOwner;
  timeRemainingMs: number;
}

/**
 * Top status bar with glass effect.
 * Layout from Figma: PHASE | CENTER TEXT | TIMER
 * Center text shows "POSITION YOUR FLEET" during placement, turn indicator otherwise.
 * Shows error glow animation when time < 5 seconds.
 */
export default function StatusHud({
  phase,
  turn,
  timeRemainingMs,
}: StatusHudProps) {
  // Error glow animation when time is low AND it's your turn
  // Only show red glow/timer when you need to act urgently
  const isYourTurn = turn === "you";
  const isLowTime = timeRemainingMs <= 5000 && timeRemainingMs > 0 && isYourTurn;
  const { ErrorGlowStyles, errorGlowStyle } = useErrorGlowAnimation({
    enabled: isLowTime,
  });
  // Format time based on remaining time
  // Above 5s: MM:SS format
  // Below 5s: X.X format (deciseconds)
  const formatTime = (ms: number) => {
    if (ms <= 5000) {
      // Below 5 seconds: show X.X format
      return (ms / 1000).toFixed(1);
    }
    // Above 5 seconds: MM:SS format
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer color: red when below 5 seconds AND it's your turn
  const timerColor = isLowTime ? "$destructive_500" : "$neutral_200";

  // Phase display text
  const phaseText = phase.toUpperCase();

  // Center text: phase-aware (LOCKED COPY)
  const getCenterContent = () => {
    if (phase === "placement") {
      return { title: "POSITION YOUR FLEET", subtitle: null };
    }
    if (phase === "finished") {
      return { title: "BATTLE COMPLETE", subtitle: null };
    }
    // Battle phase
    if (turn === "you") {
      return { title: "YOUR MOVE", subtitle: "Select a target" };
    }
    return { title: "ENEMY MOVING", subtitle: "Awaiting strike" };
  };

  const { title: centerTitle, subtitle: centerSubtitle } = getCenterContent();
  const centerColor = phase === "placement"
    ? "$secondary_500"
    : turn === "you"
      ? "$secondary_500"
      : "$primary_500";

  // Combine glass effect with error glow when active
  const containerStyle = isLowTime
    ? { ...glassEffectStyle, ...errorGlowStyle }
    : glassEffectStyle;

  return (
    <>
      <ErrorGlowStyles />
      <XStack justifyContent="center" alignItems="center">
        {/* Center status container with error glow when time is low */}
        <View
          paddingHorizontal="$6"
          paddingVertical="$2"
          borderRadius={14}
          width={480}
          style={containerStyle}
        >
          <XStack justifyContent="space-between" alignItems="center">
            {/* Phase */}
            <View width={80}>
              <UText variant="label-md" color="$neutral_400">
                {phaseText}
              </UText>
            </View>

            {/* Center text - phase-aware (LOCKED COPY) */}
            <View alignItems="center">
              <UText variant="h2" color={centerColor}>
                {centerTitle}
              </UText>
              {centerSubtitle && (
                <UText variant="label-sm" color="$neutral_400">
                  {centerSubtitle}
                </UText>
              )}
            </View>

            {/* Timer - red when below 5 seconds */}
            <View width={80}>
              <UText variant="label-lg" color={timerColor} textAlign="right">
                {formatTime(timeRemainingMs)}
              </UText>
            </View>
          </XStack>
        </View>
      </XStack>
    </>
  );
}
