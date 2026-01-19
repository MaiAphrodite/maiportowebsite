---
description: Development workflow for feature implementation
---

# Feature Implementation Workflow

1. **Plan**
   - Read `ARCHITECTURE.md` to understand where your feature belongs.
   - If adding a new feature, create `src/features/<feature-name>`.
   - If modifying existing, check `src/features/<feature-name>`.

2. **Implement**
   - Create components in `components/`.
   - Create hooks in `hooks/`.
   - Export public API in `index.ts`.
   - **Rule**: Do not import from internal paths of other features. Use their `index.ts`.

3. **Verify**
   - Run linting:
   // turbo
   ```bash
   bun run lint
   ```
   - Run typecheck:
   // turbo
   ```bash
   bunx tsc --noEmit
   ```
   - Run build:
   // turbo
   ```bash
   bun run build
   ```

4. **Commit**
   - Use conventional commits (e.g., `feat(chat): add ...`).
