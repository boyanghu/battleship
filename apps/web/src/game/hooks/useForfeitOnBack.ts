"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@server/_generated/api";
import type { Id } from "@server/_generated/dataModel";

interface UseForfeitOnBackOptions {
  gameId: string;
  deviceId: string | null;
  /** Only intercept back navigation when in these phases */
  activePhases: string[];
  /** Current game phase */
  currentPhase: string;
}

/**
 * Hook to intercept browser back button and show forfeit confirmation.
 * 
 * When the user clicks the browser back button during an active game phase,
 * shows a confirmation dialog. If confirmed, forfeits the game and allows
 * navigation. If cancelled, stays on the current page.
 * 
 * Note: This uses window.confirm() for simplicity. A custom modal could
 * be implemented for a better UX.
 */
export function useForfeitOnBack({
  gameId,
  deviceId,
  activePhases,
  currentPhase,
}: UseForfeitOnBackOptions) {
  const forfeitGameMutation = useMutation(api.games.forfeitGame);
  const isActiveRef = useRef(false);
  const hasHandledRef = useRef(false);

  // Track if hook is active based on current phase
  isActiveRef.current = activePhases.includes(currentPhase);

  // Handle popstate (browser back/forward)
  const handlePopState = useCallback(
    async (event: PopStateEvent) => {
      // Only intercept if hook is active and we have valid game info
      if (!isActiveRef.current || !deviceId || hasHandledRef.current) {
        return;
      }

      // Prevent handling multiple times
      hasHandledRef.current = true;

      // Push state back to prevent immediate navigation
      // We need to do this to "catch" the back button
      window.history.pushState(null, "", window.location.href);

      // Show confirmation dialog
      const shouldForfeit = window.confirm(
        "Going back will forfeit the game. Are you sure you want to leave?"
      );

      if (shouldForfeit) {
        try {
          // Forfeit the game
          await forfeitGameMutation({
            gameId: gameId as Id<"games">,
            deviceId,
          });
          
          // Now actually go back
          hasHandledRef.current = false;
          window.history.back();
        } catch (error) {
          console.error("Failed to forfeit game:", error);
          hasHandledRef.current = false;
        }
      } else {
        // User cancelled, stay on page
        hasHandledRef.current = false;
      }
    },
    [gameId, deviceId, forfeitGameMutation]
  );

  useEffect(() => {
    // Only set up handler if we're in an active phase
    if (!activePhases.includes(currentPhase) || !deviceId) {
      return;
    }

    // Push initial state so we can detect back button
    window.history.pushState(null, "", window.location.href);

    // Listen for popstate (back/forward button)
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentPhase, activePhases, deviceId, handlePopState]);

  // Reset handled flag when phase changes
  useEffect(() => {
    hasHandledRef.current = false;
  }, [currentPhase]);
}

export default useForfeitOnBack;
