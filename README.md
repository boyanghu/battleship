# Battleship

Competitive Battleship game infrastructure with Next.js (App Router), Tamagui, and Convex.

## Structure

- `apps/web` - Next.js App Router frontend
- `convex` - Convex backend (queries, mutations, schema)

## Getting Started

1. Install dependencies

```bash
pnpm install
```

2. Set environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_CONVEX_URL` from your Convex deployment (or `convex dev`).

3. Run development servers (Next.js + Convex)

```bash
pnpm dev
```

## Convex

- Start local/dev deployment: `pnpm convex:dev`
- Deploy: `pnpm convex:deploy`

## Notes

- `pnpm dev` runs the Next.js app and `convex dev` concurrently.
- Client code uses `@server/_generated/api` for typed Convex functions.
