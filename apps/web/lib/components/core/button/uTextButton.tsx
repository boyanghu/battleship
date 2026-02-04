"use client";

import { forwardRef, useCallback } from "react";
import { Button, styled, type TamaguiElement } from "tamagui";

import { UText } from "../text";
import type { ButtonSize, ButtonVariant } from "./buttonTypes";
import {
  sizeConfig,
  getContentColor,
  variantColors,
  disabledColors,
} from "./buttonStyles";
import { useGlowAnimation, staticGlowStyle } from "@/lib/styles";
import type { LogEventBuilder } from "@/lib/analytics";

interface UTextButtonProps {
  text: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
});

/**
 * Text button component from Figma design system.
 * Supports primary, glow, secondary, and ghost variants.
 * Glow variant features pulsating animation (1s duration).
 * Requires eventBuilder prop for analytics tracking.
 */
const UTextButton = forwardRef<TamaguiElement, UTextButtonProps>(
  (props, ref) => {
    const {
      text,
      variant = "primary",
      size = "md",
      disabled = false,
      fullWidth = false,
      onPress,
      eventBuilder,
    } = props;

    const sizeStyles = sizeConfig[size];
    const colors = variantColors[variant];
    const textColor = getContentColor(variant, disabled);

    const backgroundColor = disabled
      ? disabledColors.backgroundColor
      : colors.backgroundColor;

    const isGlow = variant === "glow" && !disabled;
    const { GlowStyles, glowStyle } = useGlowAnimation({
      duration: 1000,
      enabled: isGlow,
    });

    // Determine the glow style to apply
    const buttonGlowStyle = isGlow
      ? glowStyle
      : variant === "glow" && disabled
        ? staticGlowStyle
        : undefined;

    const handlePress = useCallback(() => {
      eventBuilder.setAction("Press").log();
      onPress?.();
    }, [eventBuilder, onPress]);

    return (
      <>
        {isGlow && <GlowStyles />}
        <StyledButton
          ref={ref}
          onPress={disabled ? undefined : handlePress}
          disabled={disabled}
          height={sizeStyles.height}
          paddingHorizontal={sizeStyles.paddingHorizontal}
          borderRadius={sizeStyles.borderRadius}
          gap={sizeStyles.gap}
          backgroundColor={backgroundColor}
          width={fullWidth ? "100%" : undefined}
          pressStyle={
            disabled
              ? undefined
              : {
                  backgroundColor: colors.pressedBackgroundColor,
                }
          }
          hoverStyle={
            disabled
              ? undefined
              : {
                  backgroundColor: colors.pressedBackgroundColor,
                  opacity: 0.9,
                }
          }
          style={buttonGlowStyle}
        >
          <UText variant={sizeStyles.textVariant} color={textColor}>
            {text}
          </UText>
        </StyledButton>
      </>
    );
  }
);

UTextButton.displayName = "UTextButton";

export default UTextButton;
