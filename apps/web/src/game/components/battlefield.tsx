"use client";

import { XStack } from "tamagui";
import Board from "./board";
import {
  type Coordinate,
  type EnemyCellState,
  type TurnOwner,
  type YourCellState,
} from "../types";

interface BattlefieldProps {
  turn: TurnOwner;
  enemyCells: Map<Coordinate, EnemyCellState>;
  yourCells: Map<Coordinate, YourCellState>;
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
  enemyCells,
  yourCells,
  recommendedCell = null,
  onFireAt,
}: BattlefieldProps) {
  const isPlayerTurn = turn === "you";

  return (
    <XStack justifyContent="center" alignItems="flex-start" gap="$7">
      {/* Enemy Board (left) */}
      <Board
        side="enemy"
        label="ENEMY WATERS"
        isActive={isPlayerTurn}
        recommendedCell={isPlayerTurn ? recommendedCell : null}
        enemyCells={enemyCells}
        onCellPress={onFireAt}
      />

      {/* Player Board (right) */}
      <Board
        side="player"
        label="YOUR FLEET"
        isActive={!isPlayerTurn}
        yourCells={yourCells}
      />
    </XStack>
  );
}
