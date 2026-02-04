import { createFont, createTamagui, createTokens } from "tamagui";

// Figma Design System Colors
const colors = {
  // Neutral palette (from Figma)
  neutral_200: "#e6eaf0",
  neutral_400: "#8e9aaf",
  neutral_700: "#2a3448",
  neutral_750: "#20283a",
  neutral_800: "#1a2130",
  neutral_850: "#141a23",
  neutral_900: "#141a23",
  neutral_950: "#0b0f14",

  // Primary (Blue - from Figma)
  primary_300: "#7fb2ff",
  primary_400: "#5b9bff",
  primary_500: "#3b82f6",
  primary_600: "#3b82f6",
  primary_700: "#1e4fd8",

  // Secondary (Orange - from Figma)
  secondary_300: "#ffd08a",
  secondary_400: "#ffb547",
  secondary_500: "#ff9b00",
  secondary_600: "#e68400",
  secondary_700: "#c66f00",

  // Destructive (Red - from Figma)
  destructive_500: "#ff4d4f",
  destructive_600: "#e23c3e",

  // Base
  base_900: "#1e1e20",

  // Semantic aliases
  bg: "#0b0f14",
  bgAlt: "#1a2130",
  text: "#e6eaf0",
  muted: "#8e9aaf",
  border: "#2a3448",
  accent: "#7fb2ff",
  shadow: "#04070c"
};

const tokens = createTokens({
  color: colors,
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    true: 16
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    true: 16
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    round: 9999,
    true: 8
  },
  zIndex: {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
    true: 10
  }
});

const headingFont = createFont({
  family: "var(--font-space-grotesk)",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    true: 16
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    5: 24,
    6: 28,
    7: 32,
    8: 36,
    9: 44,
    true: 20
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700"
  },
  letterSpacing: {
    1: 0,
    2: -0.2,
    3: -0.3,
    4: -0.4,
    5: -0.5,
    6: -0.6,
    7: -0.7,
    8: -0.8,
    9: -1,
    true: 0
  }
});

const bodyFont = createFont({
  family: "var(--font-source-sans-3)",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 22,
    7: 24,
    8: 28,
    9: 32,
    true: 16
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    4: 24,
    5: 26,
    6: 28,
    7: 30,
    8: 34,
    9: 38,
    true: 22
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700"
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: -0.1,
    8: -0.2,
    9: -0.3,
    true: 0
  }
});

const config = createTamagui({
  defaultTheme: "dark",
  shouldAddPrefersColorThemes: false,
  tokens,
  fonts: {
    heading: headingFont,
    body: bodyFont
  },
  themes: {
    dark: {
      background: colors.bg,
      backgroundHover: colors.bgAlt,
      backgroundPress: colors.neutral_800,
      color: colors.text,
      colorHover: colors.neutral_200,
      colorPress: colors.muted,
      borderColor: colors.border,
      placeholderColor: colors.muted,
      shadowColor: colors.shadow
    }
  },
  shorthands: {
    p: "padding",
    px: "paddingHorizontal",
    py: "paddingVertical",
    m: "margin",
    mx: "marginHorizontal",
    my: "marginVertical",
    bg: "backgroundColor"
  }
});

export default config;
export type AppTamaguiConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
