"use client";

import { View, XStack, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { glassEffectStyle } from "@/lib/styles";

// Ship types in order
const SHIP_ORDER = ["carrier", "battleship", "cruiser", "submarine", "destroyer"] as const;
const SHIP_DISPLAY_NAMES: Record<string, string> = {
  carrier: "CARRIER",
  battleship: "BATTLESHIP",
  cruiser: "CRUISER",
  submarine: "SUBMARINE",
  destroyer: "DESTROYER",
};

// Ship health data for each ship
export interface ShipHealth {
  shipType: string;
  hitsRemaining: number; // health left (ship.length - hits taken)
  isSunk: boolean;
}

interface PlayerStatusSidebarProps {
  playerShipsHealth: ShipHealth[];
  enemySunkShips: string[];
  playerTimeoutCount: number;
  enemyTimeoutCount: number;
  maxTimeouts: number;
}

/**
 * Right sidebar showing player and enemy fleet status.
 * Positioned on the right side of the battle screen.
 *
 * Player card shows ship health (hits remaining).
 * Enemy card shows only which ships are sunk (no hit counts).
 * Both cards show timeout dots (lives).
 */
export default function PlayerStatusSidebar({
  playerShipsHealth,
  enemySunkShips,
  playerTimeoutCount,
  enemyTimeoutCount,
  maxTimeouts,
}: PlayerStatusSidebarProps) {
  // Calculate ships remaining
  const playerShipsRemaining = playerShipsHealth.filter((s) => !s.isSunk).length;
  const enemyShipsRemaining = 5 - enemySunkShips.length;

  return (
    <YStack gap="$3" alignItems="flex-start">
      {/* Player (YOU) Card */}
      <View
        borderRadius={14}
        padding="$4"
        style={glassEffectStyle}
      >
        <YStack gap="$3" alignItems="center">
          {/* Header */}
          <YStack gap="$1" alignItems="center" width="100%">
            <UText variant="label-sm" color="$secondary_500">
              YOU
            </UText>
            <UText variant="label-lg" color="$neutral_200">
              {playerShipsRemaining} SHIPS LEFT
            </UText>
          </YStack>

          {/* Divider */}
          <Divider />

          {/* Ship List with Health */}
          <YStack gap="$1" alignItems="flex-end">
            {SHIP_ORDER.map((shipType) => {
              const shipHealth = playerShipsHealth.find((s) => s.shipType === shipType);
              const isSunk = shipHealth?.isSunk ?? false;
              const hitsRemaining = shipHealth?.hitsRemaining ?? 0;

              return (
                <UText
                  key={shipType}
                  variant="label-md"
                  color={isSunk ? "$neutral_700" : "$secondary_500"}
                >
                  {SHIP_DISPLAY_NAMES[shipType]} [{hitsRemaining}]
                </UText>
              );
            })}
          </YStack>

          {/* Divider */}
          <Divider />

          {/* Timeouts */}
          <YStack gap="$1" alignItems="center">
            <UText variant="label-sm" color="$neutral_200">
              TIMEOUTS
            </UText>
            <TimeoutDots
              used={playerTimeoutCount}
              max={maxTimeouts}
              color="$secondary_500"
            />
          </YStack>
        </YStack>
      </View>

      {/* Enemy Card */}
      <View
        borderRadius={14}
        padding="$4"
        width="100%"
        style={glassEffectStyle}
      >
        <YStack gap="$3" alignItems="center">
          {/* Header */}
          <YStack gap="$1" alignItems="center" width="100%">
            <UText variant="label-sm" color="$primary_500">
              ENEMY
            </UText>
            <UText variant="label-lg" color="$neutral_200">
              {enemyShipsRemaining} SHIPS LEFT
            </UText>
          </YStack>

          {/* Divider */}
          <Divider />

          {/* Ship List (no health shown for enemy) */}
          <YStack gap="$1" alignItems="flex-end">
            {SHIP_ORDER.map((shipType) => {
              const isSunk = enemySunkShips.includes(shipType);

              return (
                <UText
                  key={shipType}
                  variant="label-md"
                  color={isSunk ? "$neutral_700" : "$primary_500"}
                >
                  {SHIP_DISPLAY_NAMES[shipType]}
                </UText>
              );
            })}
          </YStack>

          {/* Divider */}
          <Divider />

          {/* Timeouts */}
          <YStack gap="$1" alignItems="center">
            <UText variant="label-sm" color="$neutral_200">
              TIMEOUTS
            </UText>
            <TimeoutDots
              used={enemyTimeoutCount}
              max={maxTimeouts}
              color="$primary_500"
            />
          </YStack>
        </YStack>
      </View>
    </YStack>
  );
}

/**
 * Simple divider line.
 */
function Divider() {
  return <View height={1} backgroundColor="$neutral_700" width={116} />;
}

interface TimeoutDotsProps {
  used: number; // Number of timeouts used
  max: number; // Maximum timeouts allowed
  color: string; // Color for filled dots
}

/**
 * Timeout dots showing remaining lives.
 * Filled dots = lives remaining, empty dots = lives used.
 */
function TimeoutDots({ used, max, color }: TimeoutDotsProps) {
  const remaining = max - used;

  return (
    <XStack gap="$2">
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < remaining;
        return (
          <View
            key={i}
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor={isFilled ? color : "$neutral_700"}
          />
        );
      })}
    </XStack>
  );
}
