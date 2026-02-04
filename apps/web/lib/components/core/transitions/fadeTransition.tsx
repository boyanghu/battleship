"use client";

import { type ReactNode } from "react";

interface FadeTransitionProps {
  children: ReactNode;
  duration?: number; // Duration in ms, default 200
  delay?: number; // Delay in ms, default 0
}

/**
 * Fade-in transition wrapper for page/component animations.
 * Applies a fade-in animation on mount.
 */
export default function FadeTransition({
  children,
  duration = 200,
  delay = 0,
}: FadeTransitionProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={{
          animation: `fadeIn ${duration}ms ease-out ${delay}ms both`,
        }}
      >
        {children}
      </div>
    </>
  );
}
