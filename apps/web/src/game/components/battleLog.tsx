"use client";

import { useEffect, useRef, useCallback } from "react";
import { View, YStack } from "tamagui";
import dynamic from "next/dynamic";
import { UText } from "@/lib/components/core/text";
import { type BattleLogEntry } from "../types";
import type { FixedSizeList as FixedSizeListType } from "react-window";

// Dynamically import react-window with SSR disabled
const FixedSizeList = dynamic(
  () => import("react-window").then((mod) => mod.FixedSizeList),
  { ssr: false }
) as typeof FixedSizeListType;

interface BattleLogProps {
  entries: BattleLogEntry[];
}

// Glass effect styles (from Figma)
const glassStyle = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(26, 33, 48, 0.5)",
};

// Virtualized list config
const LIST_HEIGHT = 300;
const LIST_WIDTH = 148; // 180 - padding
const ITEM_HEIGHT = 50; // Height of each entry row

/**
 * Battle log panel - vertically centered on left side of screen.
 * Shows chronological record of actions with glass effect.
 * Uses react-window for virtualized rendering.
 * Color coding: YOU = secondary (orange), ENEMY = primary (blue)
 */
export default function BattleLog({ entries }: BattleLogProps) {
  const listRef = useRef<FixedSizeListType>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (listRef.current && entries.length > 0) {
      listRef.current.scrollToItem(entries.length - 1, "end");
    }
  }, [entries.length]);

  // Row renderer for virtualized list
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const entry = entries[index];
      return (
        <div style={style}>
          <BattleLogEntryRow entry={entry} />
        </div>
      );
    },
    [entries]
  );

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
        <UText variant="label-md" color="$neutral_400" textAlign="right">
          BATTLE LOG
        </UText>

        {/* Divider */}
        <View height={1} backgroundColor="$neutral_700" width="100%" />

        {/* Entries - virtualized list */}
        {entries.length === 0 ? (
          <UText variant="body-sm" color="$neutral_400">
            No actions yet.
          </UText>
        ) : (
          <FixedSizeList
            ref={listRef}
            height={Math.min(LIST_HEIGHT, entries.length * ITEM_HEIGHT)}
            width={LIST_WIDTH}
            itemCount={entries.length}
            itemSize={ITEM_HEIGHT}
          >
            {Row}
          </FixedSizeList>
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
