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

# Battleship — Approach & Design Notes

[Live link](https://battleship-web-gamma.vercel.app/)

## Goal and Philosophy

My main goal with this take-home was simple: make something that’s actually fun to play, while showing how I think about shipping a real product end to end.

Battleship is a well-worn idea, so I didn’t want to stand out by adding more features. I wanted it to stand out by feel—pacing, clarity, and polish. I intentionally prioritized user experience and moment-to-moment interaction over breadth. Especially with games, design decisions matter as much as the underlying logic.

This project also reflects how I normally work: design first in Figma, treat design as a source of truth, then translate it into code with the help of AI tools. That workflow lets me move fast without losing coherence.

I intentionally skipped mobile for this take-home. While I’m comfortable building mobile experiences, Sentience is currently desktop-focused, and I wanted to align with the product as it exists today.

---

## Architecture and Source of Truth

The server is the source of truth for all game state. I used Convex mainly because it gives me real-time updates without having to manage WebSockets directly, and because it handles reconnects and refreshes cleanly.

All critical decisions—turn order, shot resolution, timers, phase transitions, and win conditions—are handled server-side. The client is a renderer that reacts to authoritative state.

Internally, the backend is structured in a pseudo event-sourced way. Important actions are recorded as events, and the current game state is derived from them. I didn’t fully implement replay or branching timelines, but the architecture supports it. That opens the door to things like PvE rewind/learning and full game replays later.

---

## Game Lifecycle and State

I think about products in terms of production and consumption. Here, the “media” being produced is the game itself. You create a game, then immediately consume it by playing.

Because of that, there’s a single game route. The client doesn’t navigate between pages like “lobby” or “battle.” Instead, it renders different UI states based on the server-defined game phase (lobby, countdown, placement, battle, post-game).

This avoids invalid navigation. You can’t refresh or deep-link into a state that no longer exists. The server always decides where the game is, and the client simply reflects that.

Timers are also server-owned. The server sets a start time and duration, and the client renders the remaining time. If you refresh or disconnect briefly, you rehydrate into the correct state automatically.

---

## Trust Boundaries and Cheating Prevention

Each client only ever receives what it’s allowed to know.

If the full game state—including both boards—lived on the client, cheating would be trivial. Instead, the server sends scoped data:
- your own ship placements
- shots fired against you
- outcomes of shots you fired
- high-level phase and turn info

Opponent ship positions are never sent. Even if someone inspects client state or network traffic, the information to cheat simply isn’t there.

---

## Turn Model and Pacing

The game is strictly turn-based with hard countdowns. This was an intentional choice to make the game feel intense, closer to speed chess than a slow board game.

I tested a few timings:
- 10 seconds felt too rushed
- 20 seconds felt too slow
- ~15 seconds felt right

That window keeps pressure high while still allowing real decisions. If a player hesitates, a lightweight strategist system nudges them forward without taking control away.

Even though the server is authoritative, the game feels responsive thanks to real-time updates and UX choices. For example, when a player hovers over the enemy board deciding where to fire, that intent is visible to the opponent (without revealing anything actionable). It adds suspense during downtime.

---

## Battle UX and Visual Language

Battleship is inherently physical. The real game has an L-shaped board, pegs, and tactile feedback. Computers don’t.

Rather than trying to recreate that literally, I took a minimalist approach. Ships are mostly outlines, both boards are always visible, and the board itself stays the focal point. Everything else—logs, guidance, timers—is secondary and pushed to the edges.

Color is used sparingly. Orange vs blue establishes player identity, inspired by systems like Counter-Strike or Portal. Red is reserved strictly for destruction so it keeps its meaning.

---

## Animation as Tactile Feedback

Animation exists to replace tactility, not to add spectacle.

Hits and misses are represented by minimal, abstract plume silhouettes from a top-down view. They’re flat, short-lived, and intentionally restrained. Their job is to acknowledge what happened without cluttering the grid.

Sound and motion smooth transitions that would otherwise feel abrupt. Without them, a shot resolving is just a state update; with them, it feels physical.

---

## Enhancing (Not Replacing) the Original Game

A core principle throughout the project was restraint.

It would have been easy to add more UI, analytics, or heavy “intelligent” features, but that would have pulled the game away from what makes Battleship fun. Any addition had to either:
1. bring the digital experience closer to the original physical game, or
2. amplify something that already exists socially (like pressure, suspense, or urgency).

Countdowns mirror friends yelling at you to hurry up. Hover intent adds suspense that only computers can provide.

The goal wasn’t to modernize Battleship into something new—it was to preserve the experience people remember, while using technology to enhance it selectively.

---

## Reflection

The thing I’m most proud of is that it’s fun. My girlfriend and I played it, and the design decisions—both what was added and what was removed—made the experience better.

If I had another week, I’d focus less on new features and more on refinement: more playtesting, tighter animations, clearer messaging, and smarter PvE behavior. My general philosophy is that a product should work really well for one person before you scale it socially.

I’m very interested in your feedback on the product decisions and overall feel—what worked, what didn’t, and how it felt to play.
