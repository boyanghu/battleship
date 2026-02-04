# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd create "<title>"   # Create a new issue
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## BEFORE STARTING WORK (MANDATORY)

STOP. Before writing any code or making any changes, you MUST create Beads issues first.

The only acceptable first actions are:

1. Reading files to understand the task
2. Creating Beads epic and tasks

### Required Workflow

1. Understand the request (read relevant files if needed)
2. Create an epic for substantial work:

```bash
bd create "My Feature" --type epic -p 1 -d "Description"
```

3. Break down into tasks under the epic:

```bash
bd create "Subtask 1" --type task --parent <epic-id>
bd create "Subtask 2" --type task --parent <epic-id>
bd create "Fix bug in feature" --type bug --parent <epic-id>
```

4. Claim your first task before starting:

```bash
bd update <task-id> --status in_progress
```

5. Now you may begin coding.

### Tracking Progress

- View your epic: `bd show <epic-id>`
- List tasks: `bd list --parent <epic-id>`
- Close completed tasks: `bd close <task-id>`
- Update status: `bd update <id> --status in_progress`

### Issue Types and Priorities

Types: `feature`, `bug`, `task`, `epic`, `chore`
Priorities: `P0` (critical) to `P4` (low), use `-p 0` through `-p 4`

Every TODO that warrants tracking should become a Beads issue with appropriate type, priority, and dependencies.

## Lucide Icons - Named Imports

When using Lucide icons, use named imports from the main package:

```typescript
// CORRECT: Named imports (tree-shakeable with proper TypeScript support)
import { ArrowRight, Camera, Home } from "lucide-react";

// AVOID: Wildcard imports (pulls in ALL icons)
import * as Icons from "lucide-react";
```

## AFTER EVERY COMMIT - ALWAYS PUSH

Every `git commit` MUST be immediately followed by `git push`.

```bash
# WRONG - commit without push leaves work stranded
git add -A && git commit -m "message"

# CORRECT - always push after commit
git add -A && git commit -m "message" && git push
```

If push fails due to no upstream:

```bash
git push --set-upstream origin $(git branch --show-current)
```

## Landing the Plane (Session Completion)

When ending a work session, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

Mandatory workflow:

1. File issues for remaining work
2. Run quality gates (if code changed) - tests, linters, builds
3. Update issue status - close finished work, update in-progress items
4. Push to remote (mandatory):

```bash
git fetch
git merge origin/main
bd sync
git push
git status  # MUST show "up to date with origin"
```

5. Clean up - clear stashes, prune remote branches
6. Verify - all changes committed and pushed
7. Hand off - provide context for next session

Critical rules:

- Work is NOT complete until `git push` succeeds
- Never stop before pushing
- Never say "ready to push when you are" - you must push
- If push fails, resolve and retry until it succeeds
- After every `git commit`, immediately run `git push`
- All errors must be resolved or confirmed as pre-existing/unrelated
