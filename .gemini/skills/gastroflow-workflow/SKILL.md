---
name: gastroflow-workflow
description: Standard operating procedure for GastroFlow development: branch management, commit standards, mandatory unit testing with Vitest, and non-negotiable browser E2E testing with Playwright before any merge to main.
---

# GastroFlow Engineering Workflow & Quality Gatekeeper

Use this skill whenever you or any subagent are implementing, refactoring, fixing, or testing any component or module in GastroFlow.

## Core Rules

1. **Never Commit Directly to `main`**:
   Always create a feature branch (`feat/...`, `fix/...`, `test/...`, `refactor/...`, `docs/...`).
2. **The Inflexible Browser Testing Gate**:
   **"Si no se hacen pruebas en navegador, no puede mergearse a main."**
   Under NO circumstance may a branch be merged into `main` without passing both:
   - `npm run test:unit` (Vitest unit tests)
   - `npm run test:e2e` (Playwright real browser tests)
3. **Atomic Conventional Commits**:
   Follow semantic commit messages: `feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`.

## Execution Steps

### 1. Branch Creation
```bash
git checkout main
git checkout -b <type>/<description>
```

### 2. Implementation
- Implement feature in `src/features/<module>/`.
- Maintain strict typing with interfaces in `src/core/types/`.
- Ensure offline-first localStorage compatibility.

### 3. Unit Testing
```bash
npm run test:unit
```
Verify that all unit tests pass.

### 4. Browser End-to-End Testing (Mandatory Gate)
```bash
npm run test:e2e
```
Playwright launches the app in a headless Chromium instance, validates DOM rendering, modal openings, state transitions, and calculations.
If a browser test fails, inspect the trace or run headed mode:
```bash
npm run test:e2e:headed
```

### 5. Documentation Update
Update the relevant file in `docs/modules/` or `docs/architecture/` before merging.

### 6. Merge to Main
```bash
git checkout main
git merge --no-ff <branch-name> -m "merge(<type>): integrate <branch-name> after passing unit and browser e2e tests"
```
