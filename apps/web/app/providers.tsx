"use client";

import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { TamaguiProvider, Theme } from "tamagui";

import config from "@/tamagui.config";
import { AnalyticsProvider } from "@/lib/analytics";

export default function Providers({ children }: PropsWithChildren) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
  const client = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProvider client={client}>
      <AnalyticsProvider>
        <TamaguiProvider config={config} defaultTheme="dark">
          <Theme name="dark">{children}</Theme>
        </TamaguiProvider>
      </AnalyticsProvider>
    </ConvexProvider>
  );
}
