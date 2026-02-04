"use client";

import { ScrollView, Button, Text, XStack, YStack } from "tamagui";
import { Crosshair, Robot, Rocket, Target } from "@phosphor-icons/react";

import { UText } from "../../lib/components/core/text";
import { UIconTextButton } from "../../lib/components/core/button";
import useAnalytics from "../../lib/analytics/useAnalytics";

interface UIconTextButtonScreenProps {
  onBack?: () => void;
}

const SectionHeader = ({ title }: { title: string }) => (
  <YStack paddingHorizontal={16} paddingVertical={12} backgroundColor="$bgAlt">
    <UText variant="label-md" color="$muted">
      {title}
    </UText>
  </YStack>
);

const UIconTextButtonScreen = ({ onBack }: UIconTextButtonScreenProps) => {
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
          UIconTextButton
        </UText>
      </XStack>

      <ScrollView flex={1}>
        <SectionHeader title="GLOW VARIANT (PULSATING)" />
        <YStack padding={16} gap={16} borderBottomWidth={1} borderBottomColor="$border">
          <XStack justifyContent="space-between" alignItems="center">
            <UText variant="label-sm" color="$accent">
              GLOW
            </UText>
            <UText variant="body-sm" color="$muted">
              Light bg, pulsating animation
            </UText>
          </XStack>
          
          <YStack gap={12} alignItems="center">
            <UIconTextButton
              text="ENGAGE ENEMY"
              icon={<Crosshair size={20} weight="regular" />}
              variant="glow"
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_glow_crosshair")}
            />
            <UIconTextButton
              text="LAUNCH"
              icon={<Rocket size={20} weight="regular" />}
              variant="glow"
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_glow_rocket")}
            />
          </YStack>
        </YStack>

        <SectionHeader title="SECONDARY VARIANT" />
        <YStack padding={16} gap={16} borderBottomWidth={1} borderBottomColor="$border">
          <XStack justifyContent="space-between" alignItems="center">
            <UText variant="label-sm" color="$accent">
              SECONDARY
            </UText>
            <UText variant="body-sm" color="$muted">
              Dark bg, no animation
            </UText>
          </XStack>
          
          <YStack gap={12} alignItems="center">
            <UIconTextButton
              text="TRAINING SESSION"
              icon={<Robot size={20} weight="regular" />}
              variant="secondary"
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_secondary_robot")}
            />
            <UIconTextButton
              text="TARGET PRACTICE"
              icon={<Target size={20} weight="regular" />}
              variant="secondary"
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_secondary_target")}
            />
          </YStack>
        </YStack>

        <SectionHeader title="WITHOUT ICONS" />
        <YStack padding={16} gap={16} borderBottomWidth={1} borderBottomColor="$border">
          <YStack gap={12} alignItems="center">
            <UIconTextButton
              text="GLOW NO ICON"
              variant="glow"
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_glow_noicon")}
            />
            <UIconTextButton
              text="SECONDARY NO ICON"
              variant="secondary"
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_secondary_noicon")}
            />
          </YStack>
        </YStack>

        <SectionHeader title="DISABLED STATE" />
        <YStack padding={16} gap={16} borderBottomWidth={1} borderBottomColor="$border">
          <YStack gap={12} alignItems="center">
            <UIconTextButton
              text="DISABLED GLOW"
              icon={<Crosshair size={20} weight="regular" />}
              variant="glow"
              disabled
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_glow_disabled")}
            />
            <UIconTextButton
              text="DISABLED SECONDARY"
              icon={<Robot size={20} weight="regular" />}
              variant="secondary"
              disabled
              eventBuilder={Event().setProductName("DevTools").setComponentName("IconButton_secondary_disabled")}
            />
          </YStack>
        </YStack>

        <YStack height={32} />
      </ScrollView>
    </YStack>
  );
};

export default UIconTextButtonScreen;
