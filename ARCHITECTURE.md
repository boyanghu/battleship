# Battleship Architecture

This document explains the current Battleship architecture, with emphasis on the Next.js client and Convex backend.

Rule: update this file whenever architectural decisions change.

---

## 1) Architecture Goals

- Realtime, low-friction two-player sessions
- Server-authoritative game state (clients send intent, never outcomes)
- Simple event log for replay and debugging
- Small, composable backend functions
- Finite state machine for game phases

---

## 2) Backend (Convex) Overview

Why Convex:

- Realtime queries for game state and event logs
- Strong runtime validation via `convex/values`
- Single source of truth for game state

### Folder Structure (follows Assemble pattern)

```
convex/
├── games/
│   ├── mutations/       # Handler functions for mutations
│   │   ├── createGame.ts
│   │   ├── joinGame.ts
│   │   ├── setReady.ts
│   │   ├── advanceFromCountdown.ts
│   │   ├── commitPlacement.ts
│   │   ├── fireShot.ts
│   │   ├── advanceTurnIfExpired.ts
│   │   └── forfeitGame.ts
│   ├── queries/         # Handler functions for queries
│   │   ├── getGame.ts
│   │   └── listGameEvents.ts
│   └── helpers.ts       # Types and utility functions
├── lib/
│   └── constants.ts     # SHIP_LENGTHS, BOARD_SIZE, durations
├── routes/
│   └── games.ts         # Exports all mutations/queries with validators
├── games.ts             # Re-exports from routes for backward compatibility
└── schema.ts            # Database schema
```

### Core Tables

**`games`**:
- `mode`: "pvp" or "pve"
- `status`: lobby → countdown → placement → battle → finished
- `hostDeviceId`: device id for the host
- `players`: array of { deviceId, ready, joinedAt, lastSeenAt }
- `boards`: Record<deviceId, { ships, shotsReceived }> (REQUIRED)
- Timing: `countdownStartedAt/DurationMs`, `placementStartedAt/DurationMs`, `turnStartedAt/DurationMs`
- `currentTurnDeviceId`, `winnerDeviceId`
- `createdAt`, `updatedAt`

**`gameEvents`**:
- Append-only log keyed by `gameId` and `seq`
- Indexed by `by_gameId_seq` for ordered reads
- Event types: GAME_CREATED, PLAYER_JOINED, PLAYER_READY_SET, COUNTDOWN_STARTED, PLACEMENT_STARTED, SHIP_PLACEMENT_COMMITTED, BATTLE_STARTED, TURN_STARTED, SHOT_FIRED, SHOT_RESOLVED, TURN_ADVANCED, TURN_SKIPPED, GAME_FINISHED, PLAYER_FORFEITED

### Mutations with Phase Guards

| Mutation | Allowed Phase(s) | Purpose |
|----------|------------------|---------|
| `createGame` | n/a | Create game with mode, generate random ships for host |
| `joinGame` | lobby | Add player with random ships, reject if full or wrong phase |
| `setReady` | lobby | Toggle ready, auto-start countdown if both ready |
| `advanceFromCountdown` | countdown | Validate timer expired, move to placement |
| `commitPlacement` | placement | Validate ships, start battle when both committed |
| `fireShot` | battle | Validate turn, resolve hit/miss/sunk, advance turn |
| `advanceTurnIfExpired` | battle | Skip turn if timeout |
| `forfeitGame` | lobby/placement/battle | End game with forfeit |

### Random Ship Placement

Ships are generated randomly on the server when:
- **Host creates game**: `createGame` generates random placement for the host
- **Guest joins**: `joinGame` generates random placement for the joining player

Each player gets a unique random layout. The `generateRandomPlacement()` helper ensures:
- All 5 required ships are placed
- Ships have random orientations (horizontal/vertical)
- No ships overlap
- All ships are within bounds

### Security: Board Visibility

**Critical**: Players must NEVER see opponent ship positions.

The `getGame` query requires `deviceId` and filters boards:
- **Requesting player's board**: Full board with ships and shotsReceived
- **Opponent's board**: Only `shotsReceived` (for rendering hit/miss markers), ships array is empty

This prevents cheating via API inspection.

### Key Logic

- **Ship length validation**: Must match `SHIP_LENGTHS[shipType]` (carrier=5, battleship=4, cruiser=3, submarine=3, destroyer=2)
- **Randomized first turn**: `Math.random()` picks first player (not host-first)
- **Timer validation**: Server uses `startedAt + durationMs` pattern, never ticks

---

## 3) Client (Next.js + Tamagui) Overview

Stack + entry points:

- Next.js App Router in `apps/web/app`
- Global providers in `apps/web/app/providers.tsx` (Convex + Tamagui)
- Global styles in `apps/web/app/globals.css`

Routes:

- `/` (home): create a game
- `/game/[gameId]`: unified game screen with phase-based UI (lobby, countdown, placement, battle, finished)
- `/lobby/[gameId]`: legacy redirect to `/game/[gameId]`

Client identity:

- `getOrCreateDeviceId` in `apps/web/lib/device.ts` provides a stable device id

---

## 4) Data Flow

1. Home page calls `createGame({ deviceId, mode })` and routes to `/game/[gameId]`.
2. GameScreen fetches game state and renders the appropriate phase component.
3. **Lobby phase**: Shows invite link, player status, ready button. Calls `joinGame`, `setReady`.
4. **Countdown phase**: Shows 5-4-3-2-1 countdown. Calls `advanceFromCountdown` when timer expires.
5. **Placement phase**: Players position ships. Calls `commitPlacement` with ship positions.
6. **Battle phase**: Players take turns firing. Calls `fireShot`, server resolves and advances turn.
7. **Finished phase**: Shows victory/defeat. Option to return home.

---

## 5) Invariants

- Only Convex mutations change game state.
- Player count is capped at 2.
- `gameEvents` is append-only and ordered by `seq`.
- Clients must handle `null` while queries load.
- Server validates all actions against current phase.
- Clients render from snapshot, never replay events to derive state.

---

## 6) Quick File Map

- `apps/web/app` - route files (pages, layout, providers)
- `apps/web/lib` - browser utilities (device id, typography)
- `apps/web/src` - feature screens (home, lobby, game)
- `apps/web/tamagui.config.ts` - tokens and theme
- `convex/schema.ts` - database schema
- `convex/routes/games.ts` - game mutations and queries (primary)
- `convex/games.ts` - re-exports for backward compatibility
- `convex/games/` - domain folder with handlers and helpers
- `convex/lib/constants.ts` - game constants

---

## 7) Design System Conventions

Player color identity:

- **YOU (current user)**: Secondary color palette (orange) - `$secondary_500` for active states
- **OPPONENT**: Primary color palette (blue) - `$primary_500` for active states
- **Waiting/inactive**: Neutral color - `$neutral_400`

This convention applies to status indicators, player badges, and any UI element that distinguishes between the current player and their opponent.
