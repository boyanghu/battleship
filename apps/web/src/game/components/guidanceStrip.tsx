"use client";

import { XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { UTextButton } from "@/lib/components/core/button";
import { type Guidance } from "../types";
import { type LogEventBuilder } from "@/lib/analytics/providers/analyticsProvider";

interface GuidanceStripProps {
  guidance: Guidance;
  onExecute: () => void;
  eventBuilder: LogEventBuilder;
}

/**
 * Bottom guidance strip with recommendation and execute button.
 * Only visible on player's turn.
 * Format: ROLE | Instruction | [EXECUTE]
 */
export default function GuidanceStrip({
  guidance,
  onExecute,
  eventBuilder,
}: GuidanceStripProps) {
  return (
    <XStack
      backgroundColor="$neutral_800"
      borderRadius="$round"
      paddingHorizontal="$5"
      paddingVertical="$3"
      alignItems="center"
      gap="$4"
      alignSelf="center"
    >
      {/* Role label */}
      <UText variant="label-sm" color="$neutral_400">
        {guidance.role}
      </UText>

      {/* Instruction */}
      <UText variant="body-md" color="$neutral_200">
        {guidance.instruction}
      </UText>

      {/* Execute button */}
      <UTextButton
        text="EXECUTE"
        variant="primary"
        size="md"
        onPress={onExecute}
        eventBuilder={eventBuilder}
      />
    </XStack>
  );
}
