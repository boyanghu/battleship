"use client";

import { useState } from "react";
import { ScrollView, Button, Text, XStack, YStack, Input } from "tamagui";

import { UText } from "../../lib/components/core/text";
import { type TextVariant } from "../../lib/components/core/text/textVariant";

interface TextPreviewScreenProps {
  onBack?: () => void;
}

interface VariantInfo {
  variant: TextVariant;
  font: string;
  size: number;
  lineHeight: number;
  weight: string;
  letterSpacing?: number;
  uppercase?: boolean;
}

const variants: VariantInfo[] = [
  // Headings - Space Grotesk
  {
    variant: "hxl",
    font: "Space Grotesk",
    size: 40,
    lineHeight: 46,
    weight: "600",
    letterSpacing: -1,
  },
  {
    variant: "h1",
    font: "Space Grotesk",
    size: 32,
    lineHeight: 38,
    weight: "600",
    letterSpacing: -0.5,
  },
  {
    variant: "h2",
    font: "Space Grotesk",
    size: 24,
    lineHeight: 30,
    weight: "500",
  },
  {
    variant: "h3",
    font: "Space Grotesk",
    size: 20,
    lineHeight: 26,
    weight: "500",
  },
  {
    variant: "h4",
    font: "Space Grotesk",
    size: 18,
    lineHeight: 24,
    weight: "500",
  },
  // Body - Source Sans 3
  {
    variant: "body-lg",
    font: "Source Sans 3",
    size: 18,
    lineHeight: 28,
    weight: "400",
  },
  {
    variant: "body-md",
    font: "Source Sans 3",
    size: 15,
    lineHeight: 22,
    weight: "400",
  },
  {
    variant: "body-sm",
    font: "Source Sans 3",
    size: 12,
    lineHeight: 18,
    weight: "400",
  },
  // Labels - Space Grotesk, ALL CAPS
  {
    variant: "label-lg",
    font: "Space Grotesk",
    size: 15,
    lineHeight: 18,
    weight: "500",
    letterSpacing: 2,
    uppercase: true,
  },
  {
    variant: "label-md",
    font: "Space Grotesk",
    size: 13,
    lineHeight: 16,
    weight: "500",
    letterSpacing: 0.39,
    uppercase: true,
  },
  {
    variant: "label-sm",
    font: "Space Grotesk",
    size: 12,
    lineHeight: 16,
    weight: "400",
    letterSpacing: 4,
    uppercase: true,
  },
];

const VariantPreview = ({
  variant,
  font,
  size,
  lineHeight,
  weight,
  letterSpacing,
  uppercase,
  previewText,
}: VariantInfo & { previewText: string }) => (
  <YStack
    padding={16}
    borderBottomWidth={1}
    borderBottomColor="$border"
    gap={8}
  >
    <XStack justifyContent="space-between" alignItems="flex-start">
      <YStack gap={2}>
        <UText variant="label-sm" color="$accent">
          {variant}
        </UText>
        <UText variant="body-sm" color="$muted">
          {font} {weight} / {size}px / {lineHeight}px
          {letterSpacing !== undefined && ` / ${letterSpacing}px`}
          {uppercase && " / CAPS"}
        </UText>
      </YStack>
    </XStack>
    <UText variant={variant} color="$text">
      {previewText || "Enter text above to preview"}
    </UText>
  </YStack>
);

const TextPreviewScreen = ({ onBack }: TextPreviewScreenProps) => {
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog"
  );

  return (
    <YStack flex={1} backgroundColor="$bg">
      {/* Header */}
      <XStack
        paddingHorizontal={16}
        paddingVertical={12}
        alignItems="center"
        backgroundColor="$bg"
        borderBottomWidth={1}
        borderBottomColor="$border"
      >
        {onBack && (
          <Button size="$3" chromeless onPress={onBack} marginRight={8}>
            <Text color="$text">← Back</Text>
          </Button>
        )}
        <UText variant="h3" color="$text">
          Text Preview
        </UText>
      </XStack>

      {/* Input Section */}
      <YStack padding={16} backgroundColor="$bgAlt" gap={8}>
        <UText variant="label-sm" color="$muted">
          PREVIEW TEXT
        </UText>
        <Input
          value={previewText}
          onChangeText={setPreviewText}
          placeholder="Enter text to preview..."
          backgroundColor="$bg"
          borderColor="$border"
          color="$text"
          placeholderTextColor="$muted"
          padding={12}
          borderRadius={8}
          fontSize={15}
        />
      </YStack>

      {/* Variants Preview */}
      <ScrollView flex={1}>
        <YStack paddingHorizontal={16} paddingVertical={12} backgroundColor="$bgAlt">
          <UText variant="label-sm" color="$muted">
            HEADINGS (Space Grotesk)
          </UText>
        </YStack>
        {variants.slice(0, 5).map((info) => (
          <VariantPreview key={info.variant} {...info} previewText={previewText} />
        ))}

        <YStack paddingHorizontal={16} paddingVertical={12} backgroundColor="$bgAlt">
          <UText variant="label-sm" color="$muted">
            BODY (Source Sans 3)
          </UText>
        </YStack>
        {variants.slice(5, 8).map((info) => (
          <VariantPreview key={info.variant} {...info} previewText={previewText} />
        ))}

        <YStack paddingHorizontal={16} paddingVertical={12} backgroundColor="$bgAlt">
          <UText variant="label-sm" color="$muted">
            LABELS (Space Grotesk, ALL CAPS)
          </UText>
        </YStack>
        {variants.slice(8).map((info) => (
          <VariantPreview key={info.variant} {...info} previewText={previewText} />
        ))}

        <YStack height={32} />
      </ScrollView>
    </YStack>
  );
};

export default TextPreviewScreen;
