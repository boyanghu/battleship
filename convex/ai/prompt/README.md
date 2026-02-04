# Prompt Modules (Reserved)

This project does not currently define AI prompt modules. If or when AI prompt infrastructure is added, keep the structure consistent and centralized.

Recommended structure:

- `modules/` for reusable prompt pieces (persona, safety, output contract)
- `buildPrompt.ts` as the single prompt builder
- `agents/` for mapping mode to a feature spec

Feature-specific prompt specs should live alongside their features (for example, `convex/<feature>/prompts/<feature>Spec.ts`).
