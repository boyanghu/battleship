"use client";

import { useState } from "react";
import { ScrollView, Button, Text, XStack, YStack, View } from "tamagui";

import { UText } from "../../lib/components/core/text";
import ColorsScreen from "./colorsScreen";
import UTextScreen from "./uTextScreen";
import TextPreviewScreen from "./textPreviewScreen";
import UTextButtonScreen from "./uTextButtonScreen";
import UIconTextButtonScreen from "./uIconTextButtonScreen";

type ScreenName = "home" | "colors" | "utext" | "textpreview" | "utextbutton" | "uicontextbutton";

interface ListItemProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

const ListItem = ({ title, subtitle, onPress }: ListItemProps) => (
  <Button
    unstyled
    onPress={onPress}
    padding={16}
    backgroundColor="$bg"
    borderBottomWidth={1}
    borderBottomColor="$border"
    hoverStyle={{ backgroundColor: "$bgAlt" }}
    pressStyle={{ backgroundColor: "$bgAlt" }}
    cursor="pointer"
  >
    <XStack alignItems="center" justifyContent="space-between" flex={1}>
      <YStack>
        <UText variant="body-md" color="$text">
          {title}
        </UText>
        <UText variant="body-sm" color="$muted">
          {subtitle}
        </UText>
      </YStack>
      <UText variant="body-md" color="$muted">
        →
      </UText>
    </XStack>
  </Button>
);

interface ComponentLibraryScreenProps {
  onBack?: () => void;
}

const ComponentLibraryScreen = ({ onBack }: ComponentLibraryScreenProps) => {
  const [screen, setScreen] = useState<ScreenName>("home");

  if (screen === "colors") {
    return <ColorsScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "utext") {
    return <UTextScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "textpreview") {
    return <TextPreviewScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "utextbutton") {
    return <UTextButtonScreen onBack={() => setScreen("home")} />;
  }

  if (screen === "uicontextbutton") {
    return <UIconTextButtonScreen onBack={() => setScreen("home")} />;
  }

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
          Component Library
        </UText>
      </XStack>

      <ScrollView flex={1}>
        <YStack paddingTop={16}>
          <View paddingHorizontal={16} paddingBottom={8}>
            <UText variant="label-sm" color="$muted">
              DESIGN TOKENS
            </UText>
          </View>
          <ListItem
            title="Colors"
            subtitle="Core color palette"
            onPress={() => setScreen("colors")}
          />

          <View paddingHorizontal={16} paddingTop={24} paddingBottom={8}>
            <UText variant="label-sm" color="$muted">
              TYPOGRAPHY
            </UText>
          </View>
          <ListItem
            title="UText"
            subtitle="11 text variants - headings, body, labels"
            onPress={() => setScreen("utext")}
          />
          <ListItem
            title="Text Preview"
            subtitle="Preview custom text in all 11 variants"
            onPress={() => setScreen("textpreview")}
          />

          <View paddingHorizontal={16} paddingTop={24} paddingBottom={8}>
            <UText variant="label-sm" color="$muted">
              COMPONENTS
            </UText>
          </View>
          <ListItem
            title="UTextButton"
            subtitle="4 variants × 4 sizes - primary, glow, secondary, ghost"
            onPress={() => setScreen("utextbutton")}
          />
          <ListItem
            title="UIconTextButton"
            subtitle="Pill buttons with icons - glow (pulsating) and secondary"
            onPress={() => setScreen("uicontextbutton")}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default ComponentLibraryScreen;
