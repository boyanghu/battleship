"use client";

import { XStack } from "tamagui";
import Board from "./board";
import { type EffectInstance } from "./effects";
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
  disabled?: boolean; // Disables all interactions (e.g., during firing or finished state)
  isFinished?: boolean; // Game is finished
  enemyHoverCoord?: Coordinate | null; // Enemy's hover position on your board (PvP)
  onCellHover?: (coordinate: Coordinate | null) => void; // Report hover position to server (PvP)
  enemyBoardEffects?: EffectInstance[]; // Plume effects for enemy board
  yourBoardEffects?: EffectInstance[]; // Plume effects for your board
  onEffectComplete?: (id: string) => void; // Callback when effect animation completes
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
  disabled = false,
  isFinished = false,
  enemyHoverCoord = null,
  onCellHover,
  enemyBoardEffects = [],
  yourBoardEffects = [],
  onEffectComplete,
}: BattlefieldProps) {
  const isPlayerTurn = turn === "you";

  // Board emphasis based on turn:
  // - When my turn: enemy board highlighted (I'm targeting it), my board de-emphasized
  // - When enemy turn: my board highlighted (they're targeting it), enemy board de-emphasized
  // - When finished: both boards de-emphasized
  const enemyHighlighted = isFinished ? false : isPlayerTurn;
  const yourHighlighted = isFinished ? false : !isPlayerTurn;

  // Enemy board is only interactive on player's turn and not disabled
  const enemyDisabled = disabled || !isPlayerTurn || isFinished;

  return (
    <XStack justifyContent="center" alignItems="flex-start" gap="$7">
      {/* Enemy Board (left) - LOCKED LABEL: "ENEMY WATERS" */}
      <Board
        side="enemy"
        label="ENEMY WATERS"
        isActive={isPlayerTurn}
        highlighted={enemyHighlighted}
        disabled={enemyDisabled}
        recommendedCell={isPlayerTurn && !disabled ? recommendedCell : null}
        enemyCells={enemyCells}
        onCellPress={onFireAt}
        onCellHover={isPlayerTurn && !disabled ? onCellHover : undefined}
        effects={enemyBoardEffects}
        onEffectComplete={onEffectComplete}
      />

      {/* Player Board (right) - LOCKED LABEL: "YOUR FLEET" */}
      <Board
        side="player"
        label="YOUR FLEET"
        isActive={!isPlayerTurn}
        highlighted={yourHighlighted}
        disabled={true} // Player board is never interactive in battle
        yourCells={yourCells}
        enemyHoverCoord={!isPlayerTurn ? enemyHoverCoord : null}
        effects={yourBoardEffects}
        onEffectComplete={onEffectComplete}
      />
    </XStack>
  );
}
