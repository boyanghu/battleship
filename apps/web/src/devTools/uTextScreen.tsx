"use client";

import { ScrollView, Button, Text, XStack, YStack } from "tamagui";

import { UText } from "../../lib/components/core/text";
import { type TextVariant } from "../../lib/components/core/text/textVariant";

interface UTextScreenProps {
  onBack?: () => void;
}

interface VariantInfo {
  variant: TextVariant;
  example: string;
  description: string;
}

const headingVariants: VariantInfo[] = [
  {
    variant: "hxl",
    example: "Battle Stations",
    description: "40px, Space Grotesk SemiBold",
  },
  {
    variant: "h1",
    example: "Your Fleet",
    description: "32px, Space Grotesk SemiBold",
  },
  {
    variant: "h2",
    example: "Enemy Territory",
    description: "24px, Space Grotesk Medium",
  },
  {
    variant: "h3",
    example: "Game Stats",
    description: "20px, Space Grotesk Medium",
  },
  {
    variant: "h4",
    example: "Recent Battles",
    description: "18px, Space Grotesk Medium",
  },
];

const bodyVariants: VariantInfo[] = [
  {
    variant: "body-lg",
    example:
      "Position your ships strategically on the grid. Consider hiding them along the edges or clustering them together.",
    description: "18px, Source Sans 3 Regular",
  },
  {
    variant: "body-md",
    example: "Click on the enemy grid to fire a shot at that position.",
    description: "15px, Source Sans 3 Regular",
  },
  {
    variant: "body-sm",
    example: "Last updated 2 minutes ago.",
    description: "12px, Source Sans 3 Regular",
  },
];

const labelVariants: VariantInfo[] = [
  {
    variant: "label-lg",
    example: "FIRE",
    description: "15px, Space Grotesk Medium, ALL CAPS",
  },
  {
    variant: "label-md",
    example: "STATUS",
    description: "13px, Space Grotesk Medium, ALL CAPS",
  },
  {
    variant: "label-sm",
    example: "YOUR TURN",
    description: "12px, Space Grotesk Regular, ALL CAPS",
  },
];

const VariantRow = ({ variant, example, description }: VariantInfo) => (
  <YStack
    padding={16}
    borderBottomWidth={1}
    borderBottomColor="$border"
    gap={8}
  >
    <XStack justifyContent="space-between" alignItems="center">
      <UText variant="label-sm" color="$accent">
        {variant}
      </UText>
      <UText variant="body-sm" color="$muted">
        {description}
      </UText>
    </XStack>
    <UText variant={variant} color="$text">
      {example}
    </UText>
  </YStack>
);

const SectionHeader = ({ title }: { title: string }) => (
  <YStack paddingHorizontal={16} paddingVertical={12} backgroundColor="$bgAlt">
    <UText variant="label-md" color="$muted">
      {title}
    </UText>
  </YStack>
);

const UTextScreen = ({ onBack }: UTextScreenProps) => {
  return (
    <YStack flex={1} backgroundColor="$bg">
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
          UText (Core)
        </UText>
      </XStack>

      <ScrollView flex={1}>
        <SectionHeader title="HEADINGS (Space Grotesk)" />
        {headingVariants.map((info, index) => (
          <VariantRow key={`${info.variant}-${index}`} {...info} />
        ))}

        <SectionHeader title="BODY (Source Sans 3)" />
        {bodyVariants.map((info, index) => (
          <VariantRow key={`${info.variant}-${index}`} {...info} />
        ))}

        <SectionHeader title="LABELS (Space Grotesk, ALL CAPS)" />
        {labelVariants.map((info, index) => (
          <VariantRow key={`${info.variant}-${index}`} {...info} />
        ))}

        <YStack height={32} />
      </ScrollView>
    </YStack>
  );
};

export default UTextScreen;
