/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as games from "../games.js";
import type * as games_helpers from "../games/helpers.js";
import type * as games_mutations_advanceFromCountdown from "../games/mutations/advanceFromCountdown.js";
import type * as games_mutations_advanceTurnIfExpired from "../games/mutations/advanceTurnIfExpired.js";
import type * as games_mutations_commitPlacement from "../games/mutations/commitPlacement.js";
import type * as games_mutations_createGame from "../games/mutations/createGame.js";
import type * as games_mutations_fireShot from "../games/mutations/fireShot.js";
import type * as games_mutations_forfeitGame from "../games/mutations/forfeitGame.js";
import type * as games_mutations_joinGame from "../games/mutations/joinGame.js";
import type * as games_mutations_setReady from "../games/mutations/setReady.js";
import type * as games_queries_getGame from "../games/queries/getGame.js";
import type * as games_queries_listGameEvents from "../games/queries/listGameEvents.js";
import type * as lib_constants from "../lib/constants.js";
import type * as routes_games from "../routes/games.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  games: typeof games;
  "games/helpers": typeof games_helpers;
  "games/mutations/advanceFromCountdown": typeof games_mutations_advanceFromCountdown;
  "games/mutations/advanceTurnIfExpired": typeof games_mutations_advanceTurnIfExpired;
  "games/mutations/commitPlacement": typeof games_mutations_commitPlacement;
  "games/mutations/createGame": typeof games_mutations_createGame;
  "games/mutations/fireShot": typeof games_mutations_fireShot;
  "games/mutations/forfeitGame": typeof games_mutations_forfeitGame;
  "games/mutations/joinGame": typeof games_mutations_joinGame;
  "games/mutations/setReady": typeof games_mutations_setReady;
  "games/queries/getGame": typeof games_queries_getGame;
  "games/queries/listGameEvents": typeof games_queries_listGameEvents;
  "lib/constants": typeof lib_constants;
  "routes/games": typeof routes_games;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
