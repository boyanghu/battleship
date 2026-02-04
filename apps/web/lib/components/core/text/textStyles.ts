import { type TextProps } from "tamagui";

import { type TextVariant } from "./textVariant";

export type TypographyStyle = Pick<
  TextProps,
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "fontWeight"
  | "letterSpacing"
  | "fontStyle"
  | "textTransform"
>;

// CSS variable font family values - cast to satisfy Tamagui's types
const FONT_SPACE_GROTESK = "var(--font-space-grotesk)" as TypographyStyle["fontFamily"];
const FONT_SOURCE_SANS_3 = "var(--font-source-sans-3)" as TypographyStyle["fontFamily"];

export const getVariantStyle = (variant: TextVariant): TypographyStyle => {
  switch (variant) {
    // Headings - Space Grotesk
    case "hxl":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 40,
        lineHeight: 46,
        fontWeight: "600",
        letterSpacing: -1,
      };
    case "h1":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "600",
        letterSpacing: -0.5,
      };
    case "h2":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "500",
      };
    case "h3":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "500",
      };
    case "h4":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "500",
      };
    // Body - Source Sans 3
    case "body-lg":
      return {
        fontFamily: FONT_SOURCE_SANS_3,
        fontSize: 18,
        lineHeight: 28,
        fontWeight: "400",
      };
    case "body-md":
      return {
        fontFamily: FONT_SOURCE_SANS_3,
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "400",
      };
    case "body-sm":
      return {
        fontFamily: FONT_SOURCE_SANS_3,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "400",
      };
    // Labels - Space Grotesk, ALL CAPS
    case "label-lg":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 15,
        lineHeight: 18,
        fontWeight: "500",
        letterSpacing: 2,
        textTransform: "uppercase",
      };
    case "label-md":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "500",
        letterSpacing: 0.39,
        textTransform: "uppercase",
      };
    case "label-sm":
      return {
        fontFamily: FONT_SPACE_GROTESK,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "400",
        letterSpacing: 4,
        textTransform: "uppercase",
      };
    default:
      return {
        fontFamily: FONT_SOURCE_SANS_3,
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "400",
      };
  }
};
