/**
 * Button styles from Figma design system.
 * All colors and sizing match Figma variables exactly.
 */
import type { TextVariant } from "../text/textVariant";
import type { ButtonSize, ButtonVariant } from "./buttonTypes";

/**
 * Size configuration for button components.
 * Values from Figma: size/xs=32, size/sm=40, size/md=48, size/lg=56
 */
export interface SizeConfig {
  height: number;
  paddingHorizontal: number;
  borderRadius: number;
  gap: number;
  iconSize: number;
  textVariant: TextVariant;
}

export const sizeConfig: Record<ButtonSize, SizeConfig> = {
  xs: {
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 999,
    gap: 4,
    iconSize: 12,
    textVariant: "label-sm",
  },
  sm: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    iconSize: 14,
    textVariant: "label-md",
  },
  md: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    iconSize: 16,
    textVariant: "label-lg",
  },
  lg: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 12,
    iconSize: 20,
    textVariant: "label-lg",
  },
};

/**
 * Color configuration for button variants.
 * All colors from Figma variables.
 */
export interface VariantColors {
  backgroundColor: string;
  textColor: string;
  pressedBackgroundColor: string;
}

export const variantColors: Record<ButtonVariant, VariantColors> = {
  primary: {
    backgroundColor: "$neutral_200",
    textColor: "$neutral_900",
    pressedBackgroundColor: "$neutral_400",
  },
  glow: {
    backgroundColor: "$neutral_200",
    textColor: "$neutral_900",
    pressedBackgroundColor: "$neutral_400",
  },
  secondary: {
    backgroundColor: "$neutral_700",
    textColor: "$neutral_200",
    pressedBackgroundColor: "$neutral_750",
  },
  ghost: {
    backgroundColor: "transparent",
    textColor: "$neutral_200",
    pressedBackgroundColor: "$neutral_750",
  },
};

/**
 * Colors applied when button is in disabled state.
 */
export const disabledColors = {
  backgroundColor: "$neutral_800",
  textColor: "$neutral_700",
};

/**
 * Returns the appropriate text/icon color based on variant and disabled state.
 */
export const getContentColor = (
  variant: ButtonVariant,
  disabled: boolean
): string => {
  return disabled ? disabledColors.textColor : variantColors[variant].textColor;
};

/**
 * Glow effect from Figma - 4 layered drop shadows.
 * Used for the "glow" variant buttons.
 *
 * Figma effect definition:
 * - Effect(type: DROP_SHADOW, color: secondary/500, offset: (0, -2), radius: 24, spread: -4)
 * - Effect(type: DROP_SHADOW, color: secondary/300, offset: (0, -1), radius: 4, spread: 0)
 * - Effect(type: DROP_SHADOW, color: primary/500, offset: (0, 4), radius: 26, spread: -4)
 * - Effect(type: DROP_SHADOW, color: primary/300, offset: (0, 2), radius: 4, spread: 0)
 */
export const glowBoxShadow = `
  0px 2px 4px 0px #7fb2ff,
  0px 4px 26px -4px #3b82f6,
  0px -1px 4px 0px #ffd08a,
  0px -2px 24px -4px #ff9b00
`.trim().replace(/\n/g, " ");
