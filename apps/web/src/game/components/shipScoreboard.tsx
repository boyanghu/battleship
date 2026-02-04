"use client";

import { View, XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { glassEffectStyle } from "@/lib/styles";
import { SHIPS } from "../utils";

interface ShipScoreboardProps {
  enemySunkShips: string[]; // Ship types sunk by player
  playerSunkShips: string[]; // Ship types sunk by enemy
}

/**
 * Horizontal ship scoreboard showing fleet status for both players.
 * Ships are displayed as compact labels with strikethrough when sunk.
 * Position: below HUD, centered horizontally.
 * 
 * Layout: ENEMY: [Ca] [Ba] [Cr] [Su] [De]  |  YOU: [Ca] [Ba] [Cr] [Su] [De]
 */
export default function ShipScoreboard({
  enemySunkShips,
  playerSunkShips,
}: ShipScoreboardProps) {
  const enemySunkSet = new Set(enemySunkShips);
  const playerSunkSet = new Set(playerSunkShips);

  return (
    <View
      paddingHorizontal="$4"
      paddingVertical="$2"
      borderRadius={10}
      alignSelf="center"
      style={glassEffectStyle}
    >
      <XStack gap="$4" alignItems="center" justifyContent="center">
        {/* Enemy Fleet */}
        <XStack gap="$2" alignItems="center">
          <UText variant="label-sm" color="$primary_500">
            ENEMY
          </UText>
          <XStack gap="$1">
            {SHIPS.map((ship) => (
              <ShipIndicator
                key={`enemy-${ship.type}`}
                abbrev={ship.abbrev}
                isSunk={enemySunkSet.has(ship.type)}
                color="$primary_500"
              />
            ))}
          </XStack>
        </XStack>

        {/* Divider */}
        <View width={1} height={16} backgroundColor="$neutral_700" />

        {/* Your Fleet */}
        <XStack gap="$2" alignItems="center">
          <UText variant="label-sm" color="$secondary_500">
            YOU
          </UText>
          <XStack gap="$1">
            {SHIPS.map((ship) => (
              <ShipIndicator
                key={`player-${ship.type}`}
                abbrev={ship.abbrev}
                isSunk={playerSunkSet.has(ship.type)}
                color="$secondary_500"
              />
            ))}
          </XStack>
        </XStack>
      </XStack>
    </View>
  );
}

interface ShipIndicatorProps {
  abbrev: string;
  isSunk: boolean;
  color: string;
}

/**
 * Individual ship indicator with abbreviation.
 * Shows colored text when active, gray with strikethrough when sunk.
 */
function ShipIndicator({ abbrev, isSunk, color }: ShipIndicatorProps) {
  return (
    <View
      paddingHorizontal="$1"
      position="relative"
    >
      <UText
        variant="label-sm"
        color={isSunk ? "$neutral_700" : color}
      >
        {abbrev}
      </UText>
      {/* Strikethrough line for sunk ships */}
      {isSunk && (
        <View
          position="absolute"
          top="50%"
          left={0}
          right={0}
          height={1}
          backgroundColor="$neutral_500"
          style={{ transform: "translateY(-50%)" } as React.CSSProperties}
        />
      )}
    </View>
  );
}
