/**
 * Hook to throttle hover updates to the server for enemy hover visualization.
 * Uses a 150ms throttle to minimize server load while maintaining smooth UX.
 */

import { useCallback, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@server/_generated/api";
import type { Id } from "@server/_generated/dataModel";
import type { Coord } from "../types";

const THROTTLE_MS = 150;

interface UseThrottledHoverOptions {
  gameId: Id<"games"> | null;
  deviceId: string | null;
  isMyTurn: boolean;
  phase: string;
}

/**
 * Returns a throttled callback to update hover position.
 * Only sends updates when it's the player's turn in battle phase.
 */
export function useThrottledHover({
  gameId,
  deviceId,
  isMyTurn,
  phase
}: UseThrottledHoverOptions) {
  const updateHoverMutation = useMutation(api.games.updateHover);
  const lastSentRef = useRef<number>(0);
  const pendingCoordRef = useRef<Coord | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clear hover when turn changes or phase changes
  useEffect(() => {
    if (gameId && deviceId && phase === "battle") {
      // Clear hover when it's no longer our turn
      if (!isMyTurn) {
        // Clear any pending updates
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        pendingCoordRef.current = null;
      }
    }
  }, [gameId, deviceId, isMyTurn, phase]);

  const sendHover = useCallback(
    async (coord: Coord | null) => {
      if (!gameId || !deviceId) return;

      try {
        await updateHoverMutation({ gameId, deviceId, coord });
      } catch {
        // Silently ignore errors - hover is non-critical
      }
    },
    [gameId, deviceId, updateHoverMutation]
  );

  const updateHover = useCallback(
    (coord: Coord | null) => {
      // Only update hover when it's our turn in battle phase
      if (!gameId || !deviceId || !isMyTurn || phase !== "battle") {
        return;
      }

      const now = Date.now();
      const timeSinceLastSent = now - lastSentRef.current;

      if (timeSinceLastSent >= THROTTLE_MS) {
        // Enough time has passed, send immediately
        lastSentRef.current = now;
        sendHover(coord);
      } else {
        // Throttle: store pending coord and schedule send
        pendingCoordRef.current = coord;

        if (!timeoutRef.current) {
          const delay = THROTTLE_MS - timeSinceLastSent;
          timeoutRef.current = setTimeout(() => {
            const pendingCoord = pendingCoordRef.current;
            pendingCoordRef.current = null;
            timeoutRef.current = null;
            lastSentRef.current = Date.now();
            sendHover(pendingCoord);
          }, delay);
        }
      }
    },
    [gameId, deviceId, isMyTurn, phase, sendHover]
  );

  // Callback to clear hover (e.g., on mouse leave)
  const clearHover = useCallback(() => {
    if (!gameId || !deviceId || phase !== "battle") return;

    // Clear any pending throttled updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingCoordRef.current = null;

    // Send null to clear hover on server
    sendHover(null);
  }, [gameId, deviceId, phase, sendHover]);

  return { updateHover, clearHover };
}
