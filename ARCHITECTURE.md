# Battleship Architecture

This document explains the current Battleship architecture, with emphasis on the Next.js client and Convex backend.

Rule: update this file whenever architectural decisions change.

---

## 1) Architecture Goals

- Realtime, low-friction two-player sessions
- Server-authoritative game state
- Simple event log for replay and debugging
- Small, composable backend functions

---

## 2) Backend (Convex) Overview

Why Convex:

- Realtime queries for game state and event logs
- Strong runtime validation via `convex/values`
- Single source of truth for game state

Core tables:

- `games`
  - `status`: lobby, countdown, placement, battle, finished
  - `hostDeviceId`: device id for the host
  - `players`: array of player objects (deviceId, side, ready, timestamps)
  - `countdownStartAt`, `currentTurnDeviceId`, `winnerDeviceId`
  - `createdAt`, `updatedAt`
- `gameEvents`
  - append-only log keyed by `gameId` and `seq`
  - indexed by `by_gameId_seq` for ordered reads

Key functions (see `convex/games.ts`):

- `createGame`: create lobby and initial event
- `joinGame`: join or refresh a player
- `setReady`: toggle readiness
- `startCountdownIfReady`: transition lobby to countdown
- `advanceToPlacement`: transition countdown to placement
- `appendEvent`: append a custom event
- `getGame`: read game state
- `listGameEvents`: read event log with pagination

Event sequencing:

- `gameEvents.seq` increments by reading the latest event and adding 1
- `gameEvents` is append-only and never mutated

---

## 3) Client (Next.js + Tamagui) Overview

Stack + entry points:

- Next.js App Router in `apps/web/app`
- Global providers in `apps/web/app/providers.tsx` (Convex + Tamagui)
- Global styles in `apps/web/app/globals.css`

Routes:

- `/` (home): create a game
- `/lobby/[gameId]`: invite link, ready state, countdown
- `/game/[gameId]`: battle HUD and event log

Client identity:

- `getOrCreateDeviceId` in `apps/web/lib/device.ts` provides a stable device id

---

## 4) Data Flow

1. Home page calls `createGame` and routes to `/lobby/[gameId]`.
2. Lobby page calls `joinGame`, toggles readiness, and triggers `startCountdownIfReady`.
3. When countdown reaches zero, the client calls `advanceToPlacement` and routes to `/game/[gameId]`.
4. Game page subscribes to `getGame` and `listGameEvents` for realtime updates.

---

## 5) Invariants

- Only Convex mutations change game state.
- Player count is capped at 2.
- `gameEvents` is append-only and ordered by `seq`.
- Clients must handle `null` while queries load.

---

## 6) Quick File Map

- `apps/web/app` - route files (pages, layout, providers)
- `apps/web/lib` - browser utilities (device id, typography)
- `apps/web/tamagui.config.ts` - tokens and theme
- `convex/schema.ts` - database schema
- `convex/games.ts` - game mutations and queries

---

## 7) Design System Conventions

Player color identity:

- **YOU (current user)**: Secondary color palette (orange) - `$secondary_500` for active states
- **OPPONENT**: Primary color palette (blue) - `$primary_500` for active states
- **Waiting/inactive**: Neutral color - `$neutral_400`

This convention applies to status indicators, player badges, and any UI element that distinguishes between the current player and their opponent.
