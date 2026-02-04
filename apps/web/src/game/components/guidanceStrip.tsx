"use client";

import { View, XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { type Guidance } from "../types";
import { type LogEventBuilder } from "@/lib/analytics/providers/analyticsProvider";

interface GuidanceStripProps {
  guidance: Guidance;
  onExecute: () => void;
  eventBuilder: LogEventBuilder;
}

// Glass effect styles (from Figma)
const glassStyle = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(26, 33, 48, 0.5)",
};

// Glow box shadow for execute button (from Figma)
const glowShadow = `
  0px 2px 4px 0px #7fb2ff,
  0px 4px 26px 0px #3b82f6,
  0px -1px 4px 0px #ffd08a,
  0px -2px 24px 0px #ff9b00
`;

/**
 * Bottom guidance strip with glass effect.
 * Shows recommendation and execute button.
 * Only visible on player's turn.
 */
export default function GuidanceStrip({
  guidance,
  onExecute,
  eventBuilder,
}: GuidanceStripProps) {
  const handlePress = () => {
    eventBuilder.setAction("click").log();
    onExecute();
  };

  return (
    <View
      paddingHorizontal="$4"
      paddingVertical="$2"
      borderRadius={14}
      width={500}
      alignSelf="center"
      // @ts-expect-error - style prop for glass effect
      style={glassStyle}
    >
      <XStack gap="$3" alignItems="center" justifyContent="center">
        {/* Role label */}
        <UText variant="label-sm" color="$neutral_400">
          {guidance.role}
        </UText>

        {/* Instruction */}
        <View flex={1}>
          <UText variant="label-md" color="$neutral_200">
            {guidance.instruction}
          </UText>
        </View>

        {/* Execute button with glow */}
        <View
          backgroundColor="$neutral_200"
          paddingHorizontal="$3"
          paddingVertical={10}
          borderRadius={10}
          cursor="pointer"
          onPress={handlePress}
          // @ts-expect-error - style prop for glow
          style={{ boxShadow: glowShadow }}
        >
          <UText variant="label-md" color="$neutral_900">
            EXECUTE
          </UText>
        </View>
      </XStack>
    </View>
  );
}
