"use client";

import { ScrollView, Button, Text, XStack, YStack } from "tamagui";

import { UText } from "../../lib/components/core/text";
import { UTextButton, type ButtonVariant, type ButtonSize } from "../../lib/components/core/button";
import useAnalytics from "../../lib/analytics/useAnalytics";

interface UTextButtonScreenProps {
  onBack?: () => void;
}

const variants: ButtonVariant[] = ["primary", "glow", "secondary", "ghost"];
const sizes: ButtonSize[] = ["xs", "sm", "md", "lg"];

const SectionHeader = ({ title }: { title: string }) => (
  <YStack paddingHorizontal={16} paddingVertical={12} backgroundColor="$bgAlt">
    <UText variant="label-md" color="$muted">
      {title}
    </UText>
  </YStack>
);

const VariantSection = ({ variant, Event }: { variant: ButtonVariant; Event: ReturnType<typeof useAnalytics>["Event"] }) => (
  <YStack padding={16} gap={16} borderBottomWidth={1} borderBottomColor="$border">
    <XStack justifyContent="space-between" alignItems="center">
      <UText variant="label-sm" color="$accent">
        {variant.toUpperCase()}
      </UText>
      <UText variant="body-sm" color="$muted">
        {variant === "glow" ? "With glow effect" : `${variant} variant`}
      </UText>
    </XStack>
    
    <XStack flexWrap="wrap" gap={12} alignItems="center">
      {sizes.map((size) => (
        <UTextButton
          key={`${variant}-${size}`}
          text={size === "xs" ? "YOU" : size === "sm" ? "FIRE" : size === "md" ? "READY" : "START GAME"}
          variant={variant}
          size={size}
          eventBuilder={Event().setProductName("DevTools").setComponentName(`Button_${variant}_${size}`)}
        />
      ))}
    </XStack>
  </YStack>
);

const DisabledSection = ({ Event }: { Event: ReturnType<typeof useAnalytics>["Event"] }) => (
  <YStack padding={16} gap={16} borderBottomWidth={1} borderBottomColor="$border">
    <XStack justifyContent="space-between" alignItems="center">
      <UText variant="label-sm" color="$accent">
        DISABLED
      </UText>
      <UText variant="body-sm" color="$muted">
        All variants disabled
      </UText>
    </XStack>
    
    <XStack flexWrap="wrap" gap={12} alignItems="center">
      {variants.map((variant) => (
        <UTextButton
          key={`disabled-${variant}`}
          text={variant.toUpperCase()}
          variant={variant}
          size="md"
          disabled
          eventBuilder={Event().setProductName("DevTools").setComponentName(`Button_${variant}_disabled`)}
        />
      ))}
    </XStack>
  </YStack>
);

const UTextButtonScreen = ({ onBack }: UTextButtonScreenProps) => {
  const { Event } = useAnalytics();

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
          UTextButton
        </UText>
      </XStack>

      <ScrollView flex={1}>
        <SectionHeader title="VARIANTS × SIZES" />
        
        {variants.map((variant) => (
          <VariantSection key={variant} variant={variant} Event={Event} />
        ))}
        
        <SectionHeader title="STATES" />
        <DisabledSection Event={Event} />

        <YStack height={32} />
      </ScrollView>
    </YStack>
  );
};

export default UTextButtonScreen;
