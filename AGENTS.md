<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project notes

- Lab data goes into the live Neon DB through idempotent scripts in `scripts/` (e.g. `scripts/import-allergy-test.mjs`), run with `npx dotenv -e .env.local -- node scripts/<file>`. Results printed as "<X" are stored as a number with a "Reported as <X" reading note.
- Allergen-specific IgE biomarkers (unit `kU/L`, name ending in `IgE`) are graded on the lab's 0–6 class scale instead of percent-out-of-range. See `isAllergenIgE` in `src/lib/status.ts`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
