"use client";

import { useRouter } from "next/navigation";
import { YStack } from "tamagui";

import { ComponentLibraryScreen } from "../../src/devTools";

export default function DevToolsPage() {
  const router = useRouter();

  return (
    <YStack flex={1} minHeight="100vh">
      <ComponentLibraryScreen onBack={() => router.back()} />
    </YStack>
  );
}
