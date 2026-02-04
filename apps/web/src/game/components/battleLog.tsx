"use client";

import { View, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { type BattleLogEntry } from "../types";

interface BattleLogProps {
  entries: BattleLogEntry[];
}

// Glass effect styles (from Figma)
const glassStyle = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(26, 33, 48, 0.5)",
};

/**
 * Battle log panel - vertically centered on left side of screen.
 * Shows chronological record of actions with glass effect.
 * Color coding: YOU = secondary (orange), ENEMY = primary (blue)
 */
export default function BattleLog({ entries }: BattleLogProps) {
  return (
    <View
      borderRadius={14}
      padding="$4"
      // @ts-expect-error - style prop for glass effect
      style={glassStyle}
    >
      <YStack gap={10}>
        {/* Header */}
        <UText variant="label-md" color="$neutral_400" textAlign="right">
          BATTLE LOG
        </UText>

        {/* Divider */}
        <View height={1} backgroundColor="$neutral_700" width="100%" />

        {/* Entries */}
        {entries.length === 0 ? (
          <UText variant="body-sm" color="$neutral_400">
            No actions yet.
          </UText>
        ) : (
          entries.map((entry) => (
            <BattleLogEntryRow key={entry.id} entry={entry} />
          ))
        )}
      </YStack>
    </View>
  );
}

interface BattleLogEntryRowProps {
  entry: BattleLogEntry;
}

function BattleLogEntryRow({ entry }: BattleLogEntryRowProps) {
  // Color based on actor (following design system conventions)
  // YOU = secondary (orange), ENEMY = primary (blue)
  const actorColor =
    entry.actor === "you" ? "$secondary_500" : "$primary_400";
  const actorText = entry.actor === "you" ? "YOU" : "ENEMY";

  // Result text
  const getResultText = () => {
    if (entry.result === "sunk" && entry.shipName) {
      return `Sunk ${entry.shipName}`;
    }
    return entry.result.charAt(0).toUpperCase() + entry.result.slice(1);
  };

  return (
    <YStack gap="$1" paddingVertical="$1">
      {/* Actor + Coordinate */}
      <UText variant="label-md" color={actorColor}>
        {actorText} → {entry.coordinate}
      </UText>

      {/* Result */}
      <UText variant="body-sm" color="$neutral_400">
        {getResultText()}
      </UText>
    </YStack>
  );
}
