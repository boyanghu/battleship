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
  glowBoxShadow,
} from "./buttonStyles";
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

    const handlePress = useCallback(() => {
      eventBuilder.setAction("Press").log();
      onPress?.();
    }, [eventBuilder, onPress]);

    return (
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
        style={isGlow ? { boxShadow: glowBoxShadow } : undefined}
      >
        <UText variant={sizeStyles.textVariant} color={textColor}>
          {text}
        </UText>
      </StyledButton>
    );
  }
);

UTextButton.displayName = "UTextButton";

export default UTextButton;
