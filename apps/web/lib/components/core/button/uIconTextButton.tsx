"use client";

import { forwardRef, useCallback, type ReactNode } from "react";
import { Button, styled, type TamaguiElement } from "tamagui";

import { UText } from "../text";
import type { LogEventBuilder } from "@/lib/analytics";
import { useGlowAnimation, staticGlowStyle } from "@/lib/styles";

type IconTextButtonVariant = "glow" | "secondary";

interface UIconTextButtonProps {
  text: string;
  icon?: ReactNode;
  variant?: IconTextButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  eventBuilder: LogEventBuilder;
}

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

/**
 * Icon + Text button component from Figma design system.
 * Features pill shape and optional pulsating glow effect (1s duration).
 */
const UIconTextButton = forwardRef<TamaguiElement, UIconTextButtonProps>(
  (props, ref) => {
    const {
      text,
      icon,
      variant = "glow",
      disabled = false,
      fullWidth = false,
      onPress,
      eventBuilder,
    } = props;

    const isGlow = variant === "glow" && !disabled;
    const { GlowStyles, glowStyle } = useGlowAnimation({
      duration: 1000,
      enabled: isGlow,
    });

    // Variant-specific colors
    const backgroundColor = variant === "glow" ? "#e6eaf0" : "#2a3448";
    const hoverBg = variant === "glow" ? "#d4dae3" : "#232c3a";
    const pressBg = variant === "glow" ? "#c8ced8" : "#1e2633";
    const textColor = variant === "glow" ? "#141a23" : "#e6eaf0";
    const disabledBg = "#1a2130";
    const disabledText = "#8e9aaf";

    const handlePress = useCallback(() => {
      eventBuilder.setAction("Press").log();
      onPress?.();
    }, [eventBuilder, onPress]);

    // Determine the glow style to apply
    const buttonGlowStyle = isGlow
      ? glowStyle
      : variant === "glow" && disabled
        ? staticGlowStyle
        : undefined;

    return (
      <>
        {isGlow && <GlowStyles />}
        <StyledButton
          ref={ref}
          onPress={disabled ? undefined : handlePress}
          disabled={disabled}
          backgroundColor={disabled ? disabledBg : backgroundColor}
          width={fullWidth ? "100%" : undefined}
          pressStyle={
            disabled
              ? undefined
              : {
                  backgroundColor: pressBg,
                }
          }
          hoverStyle={
            disabled
              ? undefined
              : {
                  backgroundColor: hoverBg,
                }
          }
          style={buttonGlowStyle}
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
