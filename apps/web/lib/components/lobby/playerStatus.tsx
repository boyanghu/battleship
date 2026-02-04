"use client";

import { XStack, View } from "tamagui";
import { UText } from "../core/text";

type PlayerRole = "you" | "opponent";
type PlayerState = "waiting" | "connected" | "ready";

interface PlayerStatusProps {
  role: PlayerRole;
  state: PlayerState;
}

const stateLabels: Record<PlayerState, string> = {
  waiting: "WAITING",
  connected: "CONNECTED",
  ready: "READY",
};

/**
 * Get dot color based on role and state.
 * YOU = secondary color (orange), OPPONENT = primary color (blue)
 */
const getDotColor = (role: PlayerRole, state: PlayerState): string => {
  if (state === "waiting") {
    return "$neutral_400";
  }
  // Connected or ready: use role-specific color
  return role === "you" ? "$secondary_500" : "$primary_500";
};

/**
 * Player status row showing role and connection state.
 * Used in lobby to show YOU and OPPONENT status.
 * 
 * Color convention:
 * - YOU (current user): Secondary color (orange)
 * - OPPONENT: Primary color (blue)
 */
const PlayerStatus = ({ role, state }: PlayerStatusProps) => {
  const label = role === "you" ? "YOU" : "OPPONENT";
  const statusLabel = stateLabels[state];
  const dotColor = getDotColor(role, state);

  return (
    <XStack
      width={300}
      padding="$4"
      borderWidth={1}
      borderColor="$neutral_700"
      borderRadius="$2"
      alignItems="center"
      gap="$3"
    >
      <UText
        variant="label-md"
        color="$neutral_400"
        flex={1}
      >
        {label}
      </UText>
      <UText variant="label-lg" color="$neutral_200">
        {statusLabel}
      </UText>
      <View
        width={10}
        height={10}
        borderRadius={5}
        backgroundColor={dotColor}
      />
    </XStack>
  );
};

export default PlayerStatus;
