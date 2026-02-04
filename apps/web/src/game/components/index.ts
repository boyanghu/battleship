export { default as StatusHud } from "./statusHud";
export { default as BattleLog } from "./battleLog";
export { default as Battlefield } from "./battlefield";
export { default as Board } from "./board";
export { default as EnemyCell } from "./enemyCell";
export { default as YourCell } from "./yourCell";
export { default as GuidanceStrip } from "./guidanceStrip";
export { default as ShipScoreboard } from "./shipScoreboard";

// Effects components
export { CellPlumeEffect, EffectsOverlay } from "./effects";
export type { PlumeVariant, EffectInstance } from "./effects";

// Phase components
export {
  LobbyPhase,
  CountdownPhase,
  PlacementPhase,
  BattlePhase,
  FinishedPhase,
} from "./phases";
