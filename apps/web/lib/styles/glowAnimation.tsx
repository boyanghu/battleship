"use client";

import { useId } from "react";

// Glow shadow values from Figma
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

interface GlowAnimationOptions {
  /** Animation duration in ms (default: 1000) */
  duration?: number;
  /** Whether the animation is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Generates CSS keyframes for pulsating glow animation.
 * Use with the GlowStyleInjector component.
 */
export const getGlowKeyframes = (animationName: string) => `
@keyframes ${animationName} {
  0%, 100% {
    box-shadow: ${glowBoxShadow};
  }
  50% {
    box-shadow: ${glowBoxShadowExpanded};
  }
}
`;

/**
 * Returns the style object for applying glow animation.
 */
export const getGlowStyle = (
  animationName: string,
  options: GlowAnimationOptions = {}
): React.CSSProperties => {
  const { duration = 1000, enabled = true } = options;

  if (!enabled) {
    return { boxShadow: glowBoxShadow };
  }

  return {
    animation: `${animationName} ${duration}ms ease-in-out infinite`,
  };
};

/**
 * Static glow style (no animation)
 */
export const staticGlowStyle: React.CSSProperties = {
  boxShadow: glowBoxShadow,
};

/**
 * Hook that provides glow animation styles and keyframes.
 * Returns a unique animation name, the keyframes CSS, and the style object.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { GlowStyles, glowStyle } = useGlowAnimation({ duration: 1000 });
 *
 *   return (
 *     <>
 *       <GlowStyles />
 *       <View style={glowStyle}>Content</View>
 *     </>
 *   );
 * }
 * ```
 */
export const useGlowAnimation = (options: GlowAnimationOptions = {}) => {
  const id = useId();
  const animationName = `pulse-glow-${id.replace(/:/g, "")}`;
  const keyframes = getGlowKeyframes(animationName);
  const glowStyle = getGlowStyle(animationName, options);

  const GlowStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: keyframes }} />
  );

  return {
    animationName,
    keyframes,
    glowStyle,
    GlowStyles,
  };
};

// Export shadow values for reuse
export { glowBoxShadow, glowBoxShadowExpanded };
