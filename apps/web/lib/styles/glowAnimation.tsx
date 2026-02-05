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

// Error glow shadow values from Figma (destructive/red colors)
const errorGlowBoxShadow = `
  0px 2px 4px 0px #ff4d4f,
  0px 4px 26px -4px #3b82f6,
  0px -1px 4px 0px #ff4d4f,
  0px -2px 24px -4px #e23c3e
`.trim().replace(/\n/g, " ");

// Expanded error glow for pulsate peak
const errorGlowBoxShadowExpanded = `
  0px 2px 6px 2px #ff4d4f,
  0px 6px 32px -2px #3b82f6,
  0px -1px 6px 2px #ff4d4f,
  0px -3px 30px -2px #e23c3e
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

/**
 * Generates CSS keyframes for pulsating error glow animation.
 */
export const getErrorGlowKeyframes = (animationName: string) => `
@keyframes ${animationName} {
  0%, 100% {
    box-shadow: ${errorGlowBoxShadow};
  }
  50% {
    box-shadow: ${errorGlowBoxShadowExpanded};
  }
}
`;

/**
 * Returns the style object for applying error glow animation.
 */
export const getErrorGlowStyle = (
  animationName: string,
  options: GlowAnimationOptions = {}
): React.CSSProperties => {
  const { duration = 1000, enabled = true } = options;

  if (!enabled) {
    return { boxShadow: errorGlowBoxShadow };
  }

  return {
    animation: `${animationName} ${duration}ms ease-in-out infinite`,
  };
};

/**
 * Static error glow style (no animation)
 */
export const staticErrorGlowStyle: React.CSSProperties = {
  boxShadow: errorGlowBoxShadow,
};

/**
 * Hook that provides error glow animation styles and keyframes.
 * Same as useGlowAnimation but with red/destructive colors.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ErrorGlowStyles, errorGlowStyle } = useErrorGlowAnimation({ enabled: isLowTime });
 *
 *   return (
 *     <>
 *       <ErrorGlowStyles />
 *       <View style={errorGlowStyle}>Content</View>
 *     </>
 *   );
 * }
 * ```
 */
export const useErrorGlowAnimation = (options: GlowAnimationOptions = {}) => {
  const id = useId();
  const animationName = `pulse-error-glow-${id.replace(/:/g, "")}`;
  const keyframes = getErrorGlowKeyframes(animationName);
  const errorGlowStyle = getErrorGlowStyle(animationName, options);

  const ErrorGlowStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: keyframes }} />
  );

  return {
    animationName,
    keyframes,
    errorGlowStyle,
    ErrorGlowStyles,
  };
};

// Export shadow values for reuse
export { glowBoxShadow, glowBoxShadowExpanded, errorGlowBoxShadow, errorGlowBoxShadowExpanded };
