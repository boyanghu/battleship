"use client";

import { ScrollView, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { type BattleLogEntry } from "../types";

interface BattleLogProps {
  entries: BattleLogEntry[];
}

/**
 * Battle log panel showing chronological record of actions.
 * Format: "YOU → A7" / "ENEMY → A7" with result below.
 * Color-coded by actor (YOU = secondary/orange, ENEMY = primary/blue).
 */
export default function BattleLog({ entries }: BattleLogProps) {
  return (
    <YStack
      width={160}
      backgroundColor="$neutral_850"
      borderRadius={8}
      padding="$3"
      gap="$3"
    >
      {/* Header */}
      <UText variant="label-md" color="$neutral_400">
        BATTLE LOG
      </UText>

      {/* Entries */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4">
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
      </ScrollView>
    </YStack>
  );
}

interface BattleLogEntryRowProps {
  entry: BattleLogEntry;
}

function BattleLogEntryRow({ entry }: BattleLogEntryRowProps) {
  // Color based on actor (following design system conventions)
  const actorColor =
    entry.actor === "you" ? "$secondary_500" : "$primary_500";
  const actorText = entry.actor === "you" ? "YOU" : "ENEMY";

  // Result text
  const getResultText = () => {
    if (entry.result === "sunk" && entry.shipName) {
      return `Sunk ${entry.shipName}`;
    }
    return entry.result.charAt(0).toUpperCase() + entry.result.slice(1);
  };

  return (
    <YStack gap="$1">
      {/* Actor + Coordinate */}
      <UText variant="label-sm" color={actorColor}>
        {actorText} → {entry.coordinate}
      </UText>

      {/* Result */}
      <UText variant="body-sm" color="$neutral_400">
        {getResultText()}
      </UText>
    </YStack>
  );
}
