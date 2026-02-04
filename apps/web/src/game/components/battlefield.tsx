"use client";

import { XStack } from "tamagui";
import Board from "./board";
import { type BoardState, type Coordinate, type TurnOwner } from "../types";

interface BattlefieldProps {
  turn: TurnOwner;
  enemyBoard: BoardState;
  playerBoard: BoardState;
  recommendedCell?: Coordinate | null;
  onFireAt?: (coordinate: Coordinate) => void;
}

/**
 * Battlefield container holding both boards side by side.
 * Active board is determined by turn ownership.
 * Enemy board is interactive on player's turn.
 */
export default function Battlefield({
  turn,
  enemyBoard,
  playerBoard,
  recommendedCell = null,
  onFireAt,
}: BattlefieldProps) {
  const isPlayerTurn = turn === "you";

  return (
    <XStack justifyContent="center" alignItems="flex-start" gap="$7">
      {/* Enemy Board (left) */}
      <Board
        side="enemy"
        state={enemyBoard}
        label="ENEMY WATERS"
        isActive={isPlayerTurn}
        interactive={isPlayerTurn}
        recommendedCell={isPlayerTurn ? recommendedCell : null}
        onCellPress={onFireAt}
      />

      {/* Player Board (right) */}
      <Board
        side="player"
        state={playerBoard}
        label="YOUR FLEET"
        isActive={!isPlayerTurn}
        interactive={false}
      />
    </XStack>
  );
}
