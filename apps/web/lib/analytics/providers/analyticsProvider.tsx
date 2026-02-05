"use client";

import React, { createContext, useCallback, useMemo } from "react";
import {
  StatsigProvider,
  useStatsigClient,
} from "@statsig/react-bindings";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";

import type LogEventAction from "../types/logEventActionEnum";

const STATSIG_CLIENT_SDK_KEY =
  process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY || "";

class LogEventBuilder {
  private productName: string = "";
  private componentName: string = "";
  private actionType: LogEventAction = "Null";
  private properties?: object;
  private statsigClient: ReturnType<typeof useStatsigClient>["client"];

  constructor(statsigClient: ReturnType<typeof useStatsigClient>["client"]) {
    this.statsigClient = statsigClient;
  }

  setProductName(productName: string) {
    this.productName = productName;
    return this;
  }

  setComponentName(componentName: string) {
    this.componentName = componentName;
    return this;
  }

  setAction(actionType: LogEventAction) {
    this.actionType = actionType;
    return this;
  }

  setProperties(properties?: object) {
    this.properties = properties;
    return this;
  }

  private createEventName = () => {
    return `${this.productName} ${this.componentName} ${this.actionType}`;
  };

  log() {
    this.statsigClient.logEvent(
      this.createEventName(),
      undefined,
      this.properties as Record<string, string>
    );
  }
}

type StatsigUserPrimitives = string | number | boolean | string[];

interface AnalyticsContextType {
  Event: () => LogEventBuilder;
  logIdentify: (
    userId: string,
    properties: Record<string, StatsigUserPrimitives>
  ) => void;
  logReset: () => void;
}

export const AnalyticsContext = createContext<AnalyticsContextType | null>(
  null
);

const AnalyticsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { client } = useStatsigClient();

  const logIdentify = useCallback(
    (userId: string, properties: Record<string, StatsigUserPrimitives>) => {
      client.updateUserAsync({
        userID: userId,
        custom: properties,
      });
    },
    [client]
  );

  const logReset = useCallback(() => {
    client.updateUserAsync({});
  }, [client]);

  const Event = useCallback(() => {
    return new LogEventBuilder(client);
  }, [client]);

  const contextValue = useMemo(
    () => ({
      Event,
      logIdentify,
      logReset,
    }),
    [Event, logIdentify, logReset]
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StatsigProvider
      sdkKey={STATSIG_CLIENT_SDK_KEY}
      user={{}}
      options={{
        plugins: [new StatsigSessionReplayPlugin()],
      }}
    >
      <AnalyticsContextProvider>{children}</AnalyticsContextProvider>
    </StatsigProvider>
  );
};

export type { LogEventBuilder };

export default AnalyticsProvider;
