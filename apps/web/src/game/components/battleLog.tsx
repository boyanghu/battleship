"use client";

import { useEffect, useRef, useMemo } from "react";
import { View, YStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { type BattleLogEntry } from "../types";

interface BattleLogProps {
  entries: BattleLogEntry[];
}

// Base glass effect styles (from Figma)
const baseGlassStyle: React.CSSProperties = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(26, 33, 48, 0.5)",
  transition: "background-color 300ms ease-out",
};

// Max height for scrollable entries container
const MAX_ENTRIES_HEIGHT = 300;

/**
 * Battle log panel - vertically centered on left side of screen.
 * Shows chronological record of actions with glass effect.
 * Entries are sorted by timestamp and scrollable.
 * Color coding: YOU = secondary (orange), ENEMY = primary (blue)
 * 
 * Latest entry is highlighted (full saturation), older entries are dimmed.
 * When a ship is sunk, background changes:
 * - YOU sunk enemy: orange tint
 * - ENEMY sunk you: blue tint
 */
export default function BattleLog({ entries }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  // Get latest entry for background color
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  // Calculate glass style based on latest entry
  const glassStyle = useMemo((): React.CSSProperties => {
    if (latestEntry?.result === "sunk") {
      // YOU sunk enemy ship -> orange background
      // ENEMY sunk your ship -> blue background
      const bgColor =
        latestEntry.actor === "you"
          ? "rgba(255, 155, 0, 0.3)" // secondary_500 with alpha
          : "rgba(59, 130, 246, 0.3)"; // primary_500 with alpha
      return { ...baseGlassStyle, backgroundColor: bgColor };
    }
    return baseGlassStyle;
  }, [latestEntry]);

  return (
    <View
      borderRadius={14}
      padding="$4"
      width={180}
      style={glassStyle}
    >
      <YStack gap={10}>
        {/* Header - fixed */}
        <UText variant="label-md" color="$neutral_400" textAlign="center">
          BATTLE LOG
        </UText>

        {/* Divider */}
        <View height={1} backgroundColor="$neutral_700" width="100%" />

        {/* Entries - scrollable div */}
        {entries.length === 0 ? (
          <UText variant="body-sm" color="$neutral_400">
            No actions yet.
          </UText>
        ) : (
          <div
            ref={scrollRef}
            style={{
              maxHeight: MAX_ENTRIES_HEIGHT,
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
          >
            <YStack gap={8}>
              {entries.map((entry, index) => (
                <BattleLogEntryRow
                  key={entry.id}
                  entry={entry}
                  isLatest={index === entries.length - 1}
                />
              ))}
            </YStack>
          </div>
        )}
      </YStack>
    </View>
  );
}

interface BattleLogEntryRowProps {
  entry: BattleLogEntry;
  isLatest: boolean;
}

function BattleLogEntryRow({ entry, isLatest }: BattleLogEntryRowProps) {
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

  // Older entries are dimmed (reduced opacity)
  const opacity = isLatest ? 1 : 0.5;

  return (
    <YStack gap="$1" paddingVertical="$1" opacity={opacity}>
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
