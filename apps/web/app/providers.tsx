"use client";

import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { TamaguiProvider, Theme, View } from "tamagui";

import config from "@/tamagui.config";
import { AnalyticsProvider } from "@/lib/analytics";

export default function Providers({ children }: PropsWithChildren) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL environment variable is not set. " +
        "Please configure it in your Vercel project settings."
    );
  }

  const client = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProvider client={client}>
      <AnalyticsProvider>
        <TamaguiProvider config={config} defaultTheme="dark">
          <Theme name="dark">
            <View flex={1} minHeight="100vh" backgroundColor="$bg">
              {children}
            </View>
          </Theme>
        </TamaguiProvider>
      </AnalyticsProvider>
    </ConvexProvider>
  );
}
