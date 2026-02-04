"use client";

import { useContext } from "react";

import { AnalyticsContext } from "./providers/analyticsProvider";

const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
};

export type { LogEventBuilder } from "./providers/analyticsProvider";

export default useAnalytics;
