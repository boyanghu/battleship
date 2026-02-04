"use client";

import { View, XStack } from "tamagui";
import { UText } from "@/lib/components/core/text";
import { useGlowAnimation } from "@/lib/styles";
import { type Guidance } from "../types";
import { type LogEventBuilder } from "@/lib/analytics/providers/analyticsProvider";

interface GuidanceStripProps {
  guidance: Guidance;
  onExecute: () => void;
  eventBuilder: LogEventBuilder;
}

// Glass effect styles (from Figma) with slide-up animation
const glassStyle: React.CSSProperties = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(26, 33, 48, 0.5)",
  animation: "slideUp 200ms ease-out",
};

/**
 * Bottom guidance strip with glass effect.
 * Shows recommendation and execute button with pulsating glow.
 * Only visible on player's turn.
 */
export default function GuidanceStrip({
  guidance,
  onExecute,
  eventBuilder,
}: GuidanceStripProps) {
  // Pulsating glow animation for execute button
  const { GlowStyles, glowStyle } = useGlowAnimation({ duration: 1000 });

  const handlePress = () => {
    eventBuilder.setAction("Press").log();
    onExecute();
  };

  return (
    <>
      {/* Inject glow animation keyframes */}
      <GlowStyles />

      {/* Slide animation keyframes */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <View
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderRadius={14}
        width={500}
        alignSelf="center"
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

          {/* Execute button with pulsating glow */}
          <View
            backgroundColor="$neutral_200"
            paddingHorizontal="$3"
            paddingVertical={10}
            borderRadius={10}
            cursor="pointer"
            onPress={handlePress}
            style={glowStyle}
          >
            <UText variant="label-md" color="$neutral_900">
              EXECUTE
            </UText>
          </View>
        </XStack>
      </View>
    </>
  );
}
