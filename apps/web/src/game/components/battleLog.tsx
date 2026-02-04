"use client";

import { useEffect, useRef } from "react";
import { View, YStack, ScrollView } from "tamagui";
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

// Max height for scrollable entries container
const MAX_ENTRIES_HEIGHT = 300;

/**
 * Battle log panel - vertically centered on left side of screen.
 * Shows chronological record of actions with glass effect.
 * Entries are sorted by timestamp and scrollable.
 * Color coding: YOU = secondary (orange), ENEMY = primary (blue)
 */
export default function BattleLog({ entries }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <View
      borderRadius={14}
      padding="$4"
      width={180}
      // @ts-expect-error - style prop for glass effect
      style={glassStyle}
    >
      <YStack gap={10}>
        {/* Header - fixed */}
        <UText variant="label-md" color="$neutral_400" textAlign="center">
          BATTLE LOG
        </UText>

        {/* Divider */}
        <View height={1} backgroundColor="$neutral_700" width="100%" />

        {/* Entries - scrollable using Tamagui ScrollView */}
        {entries.length === 0 ? (
          <UText variant="body-sm" color="$neutral_400">
            No actions yet.
          </UText>
        ) : (
          <ScrollView
            ref={scrollRef}
            maxHeight={MAX_ENTRIES_HEIGHT}
            showsVerticalScrollIndicator={false}
          >
            <YStack gap={8}>
              {entries.map((entry) => (
                <BattleLogEntryRow key={entry.id} entry={entry} />
              ))}
            </YStack>
          </ScrollView>
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
