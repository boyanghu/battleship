"use client";

import { useEffect, useState } from "react";

/**
 * Effect variants with associated colors and opacities.
 * Colors align with design system conventions:
 * - miss: neutral gray (subtle vapor)
 * - hitEnemy: secondary/orange (warm plume)
 * - hitMe: destructive red (heavy plume)
 */
export type PlumeVariant = "miss" | "hitEnemy" | "hitMe";

interface CellPlumeEffectProps {
  variant: PlumeVariant;
  sizePx?: number;
  onComplete?: () => void;
}

// Variant-specific colors and opacities
const VARIANT_STYLES: Record<PlumeVariant, { color: string; maxOpacity: number }> = {
  miss: { color: "#8e9aaf", maxOpacity: 0.25 }, // $neutral_400
  hitEnemy: { color: "#f59e0b", maxOpacity: 0.4 }, // $secondary_500 (orange)
  hitMe: { color: "#ef4444", maxOpacity: 0.45 }, // $destructive_500 (red)
};

// Animation duration in ms
const ANIMATION_DURATION = 700;

/**
 * Irregular cloud-like plume silhouette SVG path.
 * Designed to look like a flat 2D top-down cut of smoke/fire.
 * Simple, minimal control points for clean rendering at small sizes.
 */
const PLUME_PATH = "M16 4c-3 0-5 2-7 4-2-1-4 0-5 2s0 4 2 5c-1 2 0 4 2 5s4 0 5-1c2 2 5 2 7 0s2-4 1-6c2-1 3-3 2-5s-3-3-5-3c0-1-1-2-2-1z";

/**
 * CellPlumeEffect - Renders a single plume effect instance.
 * 
 * 3-stage animation (total ~700ms):
 * - Stage 1 (0-120ms): appear - opacity 0→1, scale 0.90→1.00
 * - Stage 2 (120-260ms): bloom - scale 1.00→1.08, opacity stays 1
 * - Stage 3 (260-700ms): fade - opacity 1→0, scale 1.08→1.12, subtle upward drift
 */
export default function CellPlumeEffect({
  variant,
  sizePx = 38, // Slightly larger than cell (32px * 1.15 ≈ 37)
  onComplete,
}: CellPlumeEffectProps) {
  const [rotation] = useState(() => Math.random() * 12 - 6); // -6deg to +6deg
  const { color, maxOpacity } = VARIANT_STYLES[variant];

  // Trigger onComplete after animation finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        width: sizePx,
        height: sizePx,
        position: "absolute",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)", // Center on cell
        animation: `plumeAnimation ${ANIMATION_DURATION}ms ease-out forwards`,
        // CSS custom properties for animation
        // @ts-expect-error CSS custom properties
        "--plume-rotation": `${rotation}deg`,
        "--plume-max-opacity": maxOpacity,
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={sizePx}
        height={sizePx}
        style={{ display: "block" }}
      >
        <path d={PLUME_PATH} fill={color} />
      </svg>

      {/* Inline keyframes for the 3-stage animation */}
      <style jsx>{`
        @keyframes plumeAnimation {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9) rotate(var(--plume-rotation));
          }
          17% {
            opacity: var(--plume-max-opacity);
            transform: translate(-50%, -50%) scale(1.0) rotate(var(--plume-rotation));
          }
          37% {
            opacity: var(--plume-max-opacity);
            transform: translate(-50%, -50%) scale(1.08) rotate(var(--plume-rotation));
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.12) rotate(var(--plume-rotation)) translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
