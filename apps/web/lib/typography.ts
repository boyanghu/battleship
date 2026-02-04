// Re-export from the new component library for backward compatibility
export type { TextVariant } from "./components/core/text/textVariant";
export { getVariantStyle, type TypographyStyle } from "./components/core/text/textStyles";

// Legacy variant mapping (for backward compatibility with old code)
export type LegacyTextVariant = "display" | "title" | "body" | "label";

export function getLegacyVariantStyle(variant: LegacyTextVariant) {
  switch (variant) {
    case "display":
      return {
        fontFamily: "var(--font-space-grotesk)",
        fontSize: 36,
        lineHeight: 42,
        fontWeight: "600",
        letterSpacing: -0.6
      } as const;
    case "title":
      return {
        fontFamily: "var(--font-space-grotesk)",
        fontSize: 22,
        lineHeight: 28,
        fontWeight: "600",
        letterSpacing: -0.2
      } as const;
    case "label":
      return {
        fontFamily: "var(--font-source-sans-3)",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
        letterSpacing: 0.6,
        textTransform: "uppercase"
      } as const;
    case "body":
    default:
      return {
        fontFamily: "var(--font-source-sans-3)",
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "400",
        letterSpacing: 0
      } as const;
  }
}
