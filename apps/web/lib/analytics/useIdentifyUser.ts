"use client";

import { useEffect, useRef } from "react";
import useAnalytics from "./useAnalytics";

/**
 * Hook to identify a user with Statsig analytics.
 * Should be called once when device ID is available.
 *
 * @param deviceId - The user's device ID (null until initialized)
 */
export function useIdentifyUser(deviceId: string | null) {
  const { logIdentify } = useAnalytics();
  const hasIdentified = useRef(false);

  useEffect(() => {
    // Only identify once per session
    if (!deviceId || hasIdentified.current) return;

    logIdentify(deviceId, {});
    hasIdentified.current = true;
  }, [deviceId, logIdentify]);
}
