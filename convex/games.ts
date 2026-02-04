/**
 * Re-export game functions from routes for backward compatibility.
 * Client code can use either:
 *   - api.games.createGame (this file)
 *   - api.routes.games.createGame (routes/games.ts)
 */

export {
  createGame,
  joinGame,
  setReady,
  advanceFromCountdown,
  advanceFromPlacement,
  commitPlacement,
  fireShot,
  advanceTurnIfExpired,
  forfeitGame,
  updateHover,
  getGame,
  listGameEvents
} from "./routes/games";
