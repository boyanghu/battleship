"use client";

import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "tamagui";

interface UPageProps extends PropsWithChildren<ViewProps> {
  /** Whether to disable the top margin */
  disableTopMargin?: boolean;
  /** Whether to disable the bottom margin */
  disableBottomMargin?: boolean;
}

/**
 * Page wrapper component that provides consistent margins for content.
 *
 * Uses margin (not padding) to allow children's shadows to extend without clipping.
 *
 * @example
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <UPage>
 *       <YourContent />
 *     </UPage>
 *   );
 * }
 * ```
 */
const UPage = ({
  children,
  disableTopMargin = false,
  disableBottomMargin = false,
  ...props
}: UPageProps) => {

  return (
    <View
      flex={1}
      margin="$6"
      overflow="hidden"
      style={{
        overflow: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </View>
  );
};

export default UPage;
