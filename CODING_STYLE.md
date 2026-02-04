# Coding Style Guide

## Before Executing Any Plan

Before implementing code from a plan, review the planning conversation for:

- New coding conventions the user established or suggested
- Design decisions that should become standard patterns
- Preferences about code organization or architecture

Add any new rules to this file first, before executing the plan.

## Workflow Reminder (see AGENTS.md for full details)

1. Create Beads issues first (epic + tasks)
2. Commit after each step and push immediately
3. All errors must be resolved (or confirmed as pre-existing/unrelated)
4. Follow AGENTS.md workflow rules

## Pre-commit Requirements

Before every commit, you MUST:

1. Run lint check - `pnpm lint` must pass with no errors
2. Run build/type check - `pnpm build` must pass with no errors
3. Review your changes for:
   - Duplicate code that should be extracted
   - Magic numbers that should use Tamagui tokens
   - Convention violations (file naming, imports, component usage)
   - Unused props or dead code

## Next.js (App Router)

- Server components are the default. Add `"use client"` only when needed.
- Route files live in `apps/web/app` and should stay thin.
- Move heavy UI and logic into `apps/web/components` or `apps/web/lib`.
- Use `next/navigation` in client components. Avoid `next/router`.
- Guard browser-only APIs with `useEffect` or `typeof window !== "undefined"`.

## Convex

- Database schema lives only in `convex/schema.ts`.
- Use `convex/values` validators for Convex data. Do not duplicate schemas with Zod.
- Keep feature functions grouped by file (for example, `convex/games.ts`).
- Client code uses `api` from `@server/_generated/api` and `Id` from `convex/values`.

## Tamagui Styling

- Prefer Tamagui primitives (`YStack`, `XStack`, `Button`, `Text`) over raw HTML elements.
- Use tokens from `apps/web/tamagui.config.ts`:
  - Colors (Figma Design System):
    - Neutral: `$neutral_200` through `$neutral_950`
    - Primary (Blue): `$primary_300` through `$primary_700`
    - Secondary (Orange): `$secondary_300` through `$secondary_700`
    - Destructive (Red): `$destructive_500`, `$destructive_600`
    - Semantic: `$bg`, `$bgAlt`, `$text`, `$muted`, `$border`, `$accent`
  - Spacing: `$0` through `$9`
  - Size: `$0` through `$9`
  - Radius: `$0` through `$4`, `$round`
- Prefer shorthands (`px`, `py`, `bg`, `m`, `p`) over inline styles.
- Use the `style` prop only for typography from `getVariantStyle`.

## File Organization

- Use `@/` for app imports and `@server/` for Convex imports.
- Keep shared browser utilities in `apps/web/lib`.
- Prefer lower camelCase for file names, except for Next.js route files
  (`page.tsx`, `layout.tsx`, `loading.tsx`, etc.).
