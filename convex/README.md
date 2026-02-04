# Convex Backend

Server-authoritative game state for Battleship.

## Structure

```
convex/
├── games/
│   ├── mutations/       # Handler functions
│   ├── queries/         # Query handlers
│   └── helpers.ts       # Types and utilities
├── lib/
│   └── constants.ts     # Game constants
├── routes/
│   └── games.ts         # Public API with validators
├── games.ts             # Re-exports for backward compatibility
└── schema.ts            # Database schema
```

## Key Concepts

- **Phase guards**: Mutations validate `game.status` before executing
- **Event sourcing**: `gameEvents` table is append-only
- **Timer validation**: Server uses `startedAt + durationMs`, never ticks

## Running

```bash
pnpm convex:dev   # Local development
pnpm convex:deploy # Deploy to production
```
