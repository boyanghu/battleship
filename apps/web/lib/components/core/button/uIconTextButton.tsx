"use client";

import { forwardRef, useCallback, type ReactNode } from "react";
import { Button, styled, type TamaguiElement } from "tamagui";

import { UText } from "../text";
import type { LogEventBuilder } from "@/lib/analytics";

type IconTextButtonVariant = "glow" | "secondary";

interface UIconTextButtonProps {
  text: string;
  icon?: ReactNode;
  variant?: IconTextButtonVariant;
  disabled?: boolean;
  onPress?: () => void;
  eventBuilder: LogEventBuilder;
}

// Glow shadow from Figma
const glowBoxShadow = `
  0px 2px 4px 0px #7fb2ff,
  0px 4px 26px -4px #3b82f6,
  0px -1px 4px 0px #ffd08a,
  0px -2px 24px -4px #ff9b00
`.trim().replace(/\n/g, " ");

// Expanded glow for pulsate peak
const glowBoxShadowExpanded = `
  0px 2px 6px 2px #7fb2ff,
  0px 6px 32px -2px #3b82f6,
  0px -1px 6px 2px #ffd08a,
  0px -3px 30px -2px #ff9b00
`.trim().replace(/\n/g, " ");

const StyledButton = styled(Button, {
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  borderWidth: 0,
  cursor: "pointer",
  height: 56,
  paddingHorizontal: 24,
  borderRadius: 999,
  gap: 12,
});

// CSS keyframes for pulsating glow
const pulseGlowKeyframes = `
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: ${glowBoxShadow};
  }
  50% {
    box-shadow: ${glowBoxShadowExpanded};
  }
}
`;

/**
 * Icon + Text button component from Figma design system.
 * Features pill shape and optional pulsating glow effect.
 */
const UIconTextButton = forwardRef<TamaguiElement, UIconTextButtonProps>(
  (props, ref) => {
    const {
      text,
      icon,
      variant = "glow",
      disabled = false,
      onPress,
      eventBuilder,
    } = props;

    const isGlow = variant === "glow" && !disabled;

    // Variant-specific colors
    const backgroundColor = variant === "glow" ? "#e6eaf0" : "#2a3448";
    const textColor = variant === "glow" ? "#141a23" : "#e6eaf0";
    const disabledBg = "#1a2130";
    const disabledText = "#8e9aaf";

    const handlePress = useCallback(() => {
      eventBuilder.setAction("Press").log();
      onPress?.();
    }, [eventBuilder, onPress]);

    return (
      <>
        {/* Inject keyframes */}
        {isGlow && (
          <style dangerouslySetInnerHTML={{ __html: pulseGlowKeyframes }} />
        )}
        <StyledButton
          ref={ref}
          onPress={disabled ? undefined : handlePress}
          disabled={disabled}
          backgroundColor={disabled ? disabledBg : backgroundColor}
          pressStyle={
            disabled
              ? undefined
              : {
                  opacity: 0.85,
                }
          }
          hoverStyle={
            disabled
              ? undefined
              : {
                  opacity: 0.9,
                }
          }
          style={
            isGlow
              ? {
                  animation: "pulse-glow 500ms ease-in-out infinite",
                }
              : undefined
          }
        >
          <UText
            variant="label-lg"
            color={disabled ? disabledText : textColor}
            letterSpacing={0.3}
          >
            {text}
          </UText>
          {icon && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                color: disabled ? disabledText : textColor,
              }}
            >
              {icon}
            </span>
          )}
        </StyledButton>
      </>
    );
  }
);

UIconTextButton.displayName = "UIconTextButton";

export default UIconTextButton;
