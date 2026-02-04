"use client";

import { useEffect, useState } from "react";
import { Button, Text, XStack, YStack } from "tamagui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@server/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import { getVariantStyle } from "@/lib/typography";
import type { Id } from "convex/values";

interface GamePageProps {
  params: { gameId: string };
}

export default function GamePage({ params }: GamePageProps) {
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.games.getGame, { gameId });
  const events = useQuery(api.games.listGameEvents, {
    gameId,
    limit: 50
  });
  const joinGame = useMutation(api.games.joinGame);

  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    joinGame({ gameId, deviceId });
  }, [deviceId, gameId, joinGame]);

  return (
    <YStack
      flex={1}
      minHeight="100vh"
      bg="$bg"
      px="$space_6"
      py="$space_6"
      gap="$space_6"
    >
      <YStack gap="$space_2">
        <Text style={getVariantStyle("display")}>Battle HUD</Text>
        <Text style={getVariantStyle("body")} color="$muted">
          Tactical systems are standing by.
        </Text>
      </YStack>

      <XStack gap="$space_4" flexWrap="wrap">
        <YStack
          borderRadius="$radius_3"
          borderColor="$border"
          borderWidth={1}
          px="$space_4"
          py="$space_3"
          gap="$space_2"
        >
          <Text style={getVariantStyle("label")} color="$muted">
            Game Status
          </Text>
          <Text style={getVariantStyle("body")}>
            {game?.status ?? "loading"}
          </Text>
        </YStack>
        <YStack
          borderRadius="$radius_3"
          borderColor="$border"
          borderWidth={1}
          px="$space_4"
          py="$space_3"
          gap="$space_2"
        >
          <Text style={getVariantStyle("label")} color="$muted">
            Turn
          </Text>
          <Text style={getVariantStyle("body")}>
            {game?.currentTurnDeviceId ?? "TBD"}
          </Text>
        </YStack>
      </XStack>

      <YStack gap="$space_3">
        <Text style={getVariantStyle("title")}>Battle Log</Text>
        <YStack
          borderRadius="$radius_3"
          borderColor="$border"
          borderWidth={1}
          px="$space_4"
          py="$space_4"
          gap="$space_2"
        >
          {events?.page?.length ? (
            events.page.map((event) => (
              <Text key={event._id} style={getVariantStyle("body")}>
                {event.seq}. {event.type}
              </Text>
            ))
          ) : (
            <Text style={getVariantStyle("body")} color="$muted">
              No events yet.
            </Text>
          )}
        </YStack>
      </YStack>

      <Button
        bg="$bgAlt"
        color="$text"
        borderRadius="$radius_3"
        px="$space_5"
        py="$space_3"
        disabled
      >
        Deploy Fleet (coming next)
      </Button>
    </YStack>
  );
}
