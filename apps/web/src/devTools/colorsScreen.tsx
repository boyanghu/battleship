"use client";

import { ScrollView, Button, Text, XStack, YStack } from "tamagui";

import { UText } from "../../lib/components/core/text";

interface ColorsScreenProps {
  onBack?: () => void;
}

interface ColorSwatchProps {
  name: string;
  value: string;
  textColor?: string;
}

const ColorSwatch = ({ name, value, textColor = "$text" }: ColorSwatchProps) => (
  <XStack
    padding={12}
    backgroundColor={value}
    borderRadius={8}
    alignItems="center"
    justifyContent="space-between"
    marginBottom={8}
  >
    <UText variant="body-md" color={textColor}>
      {name}
    </UText>
    <UText variant="body-sm" color={textColor}>
      {value}
    </UText>
  </XStack>
);

const SectionHeader = ({ title }: { title: string }) => (
  <YStack paddingVertical={12}>
    <UText variant="label-md" color="$muted">
      {title}
    </UText>
  </YStack>
);

const ColorsScreen = ({ onBack }: ColorsScreenProps) => {
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
          Colors
        </UText>
      </XStack>

      <ScrollView flex={1} padding={16}>
        <SectionHeader title="SEMANTIC COLORS" />
        <ColorSwatch name="$bg" value="$bg" />
        <ColorSwatch name="$bgAlt" value="$bgAlt" />
        <ColorSwatch name="$text" value="$text" textColor="$bg" />
        <ColorSwatch name="$muted" value="$muted" textColor="$bg" />
        <ColorSwatch name="$border" value="$border" />
        <ColorSwatch name="$accent" value="$accent" textColor="$bg" />

        <SectionHeader title="NEUTRAL PALETTE" />
        <ColorSwatch name="$neutral_200" value="$neutral_200" textColor="$bg" />
        <ColorSwatch name="$neutral_400" value="$neutral_400" textColor="$bg" />
        <ColorSwatch name="$neutral_700" value="$neutral_700" />
        <ColorSwatch name="$neutral_750" value="$neutral_750" />
        <ColorSwatch name="$neutral_800" value="$neutral_800" />
        <ColorSwatch name="$neutral_850" value="$neutral_850" />
        <ColorSwatch name="$neutral_900" value="$neutral_900" />
        <ColorSwatch name="$neutral_950" value="$neutral_950" />

        <SectionHeader title="PRIMARY (BLUE)" />
        <ColorSwatch name="$primary_300" value="$primary_300" textColor="$bg" />
        <ColorSwatch name="$primary_400" value="$primary_400" textColor="$bg" />
        <ColorSwatch name="$primary_500" value="$primary_500" textColor="$text" />
        <ColorSwatch name="$primary_600" value="$primary_600" textColor="$text" />
        <ColorSwatch name="$primary_700" value="$primary_700" textColor="$text" />

        <SectionHeader title="SECONDARY (ORANGE)" />
        <ColorSwatch name="$secondary_300" value="$secondary_300" textColor="$bg" />
        <ColorSwatch name="$secondary_400" value="$secondary_400" textColor="$bg" />
        <ColorSwatch name="$secondary_500" value="$secondary_500" textColor="$bg" />
        <ColorSwatch name="$secondary_600" value="$secondary_600" textColor="$bg" />
        <ColorSwatch name="$secondary_700" value="$secondary_700" textColor="$text" />

        <SectionHeader title="DESTRUCTIVE (RED)" />
        <ColorSwatch name="$destructive_500" value="$destructive_500" textColor="$text" />
        <ColorSwatch name="$destructive_600" value="$destructive_600" textColor="$text" />

        <YStack height={32} />
      </ScrollView>
    </YStack>
  );
};

export default ColorsScreen;
