"use client";

import { useCallback, useState } from "react";
import { XStack, View } from "tamagui";
import { Copy, Check } from "@phosphor-icons/react";

import { UText } from "../core/text";
import type { LogEventBuilder } from "@/lib/analytics";

interface ShareLinkBoxProps {
  url: string;
  eventBuilder: LogEventBuilder;
}

/**
 * Share link box with copy button.
 * Shows the game URL and allows copying to clipboard.
 */
const ShareLinkBox = ({ url, eventBuilder }: ShareLinkBoxProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    eventBuilder.setAction("Press").log();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url, eventBuilder]);

  return (
    <XStack
      backgroundColor="$neutral_800"
      padding="$4"
      borderRadius="$3"
      alignItems="center"
      gap="$3"
      style={{
        boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.25)",
      }}
    >
      {/* URL Display */}
      <View
        backgroundColor="$neutral_900"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$2"
      >
        <UText variant="body-sm" color="$neutral_200">
          {url}
        </UText>
      </View>

      {/* Copy Button */}
      <XStack
        height={48}
        paddingHorizontal="$4"
        borderRadius="$3"
        alignItems="center"
        justifyContent="center"
        gap="$2"
        cursor="pointer"
        hoverStyle={{
          backgroundColor: "$neutral_700",
        }}
        pressStyle={{
          backgroundColor: "$neutral_700",
        }}
        onPress={handleCopy}
      >
        <UText variant="label-lg" color="$neutral_200">
          {copied ? "COPIED" : "COPY"}
        </UText>
        {copied ? (
          <Check size={16} color="#e6eaf0" weight="regular" />
        ) : (
          <Copy size={16} color="#e6eaf0" weight="regular" />
        )}
      </XStack>
    </XStack>
  );
};

export default ShareLinkBox;
