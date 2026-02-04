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
  // Web-simplified margins (no safe area insets needed)
  const shadowPadding = 12; // Extra space for shadows
  const marginTop = disableTopMargin ? 4 : 4;
  const marginBottom = disableBottomMargin ? 4 : 4 + shadowPadding;
  const marginHorizontal = 16;

  return (
    <View
      flex={1}
      marginTop={marginTop}
      marginBottom={marginBottom}
      marginLeft={marginHorizontal}
      marginRight={marginHorizontal}
      bg="$transparent"
      overflow="visible"
      {...props}
    >
      {children}
    </View>
  );
};

export default UPage;
