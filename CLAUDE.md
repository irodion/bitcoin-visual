# BitcoinVault

Interactive Bitcoin cryptography learning PWA. No backend — all crypto runs client-side using `@noble/*` libraries.

## Quick Reference

```bash
vp dev              # dev server
vp check            # lint + format + typecheck
vp test run         # run tests once
vp build            # production build
```

## Stack

React 19, TypeScript, Tailwind CSS v4, VitePlus (Vite + Oxlint + Oxfmt + Vitest), Zustand, Framer Motion, vite-plugin-pwa.

## Crypto Constraint

All cryptographic operations MUST use `@noble/hashes`, `@noble/curves`, `@scure/bip32`, `@scure/bip39`. No `window.crypto.subtle` for pedagogical ops — values must be inspectable at every intermediate step.

## Module Structure

Each module lives in `src/modules/NN-name/` and is a self-contained route. Shared utilities go in `src/shared/{crypto,components,hooks}`.

## Security

- Private keys are in-memory only (React/Zustand state), never persisted
- Zero network requests at runtime
- Attack Lab module requires a non-dismissible disclaimer on every screen

## Development Discipline

### Before calling any library API, grep for existing usage in the codebase

Don't guess function names or import paths. The codebase likely already calls the same API somewhere — match that pattern exactly.

### Before writing validation or data-flow logic, check how the same data is handled elsewhere

If a value is validated in one place (e.g., a hook), mirror that validation everywhere the same value is consumed. Don't substitute try/catch for proper checks.

### When writing tests for components that use `AnimatePresence mode="wait"`, always use async queries (`findBy*`) after state changes that trigger tab/section switches

Sync queries (`getBy*`) will fail because exit animations must complete before new content mounts.

### When text appears in multiple DOM locations (theory panel + interactive UI), use `getByRole` or scoped queries instead of `getByText`

Tab buttons, heading text, and concept cards often share labels. Prefer `getByRole("tab", { name: "..." })` for tab assertions.

### When fixing a bug, grep for the same pattern across all new/changed code before moving on

Treat each bug as a class — the same mistake likely exists in adjacent code written in the same session.

### When rendering items in a loop, consider per-item cost upfront

Use `Set` or `Map` for lookups instead of `.some()`/`.find()` inside render loops. Wrap derived arrays in `useMemo` when they're passed as props.

### Every element with `role="button"` must have keyboard support

Add `tabIndex={0}` and an `onKeyDown` handler for Enter and Space at the same time as adding click handlers. Don't defer a11y to review.

### Use literal Unicode characters in JSX strings, never escape sequences

Write `→`, `—`, `′`, `✓`, `✗` directly — not `\u2192`, `\u2014`, `\u2032`, `\u2713`, `\u2717`. Escape sequences are unreadable in source and harder to review.

### In Bash tool calls, run commands through `./node_modules/.bin/vp`

The short `vp` form works in the developer's terminal (shell profile defines the function) but not in Bash tool calls which don't load the profile. Use the full local binary path. Don't fall back to `npx vitest` or `pnpm exec` — they resolve to different binaries.

## Reference Docs

- [Architecture & Design System](docs/references/architecture.md)
- [Development Guide](docs/references/development.md)
- [Testing Guide](docs/references/tests.md)
- [Commit Guidelines](docs/references/commits.md)
- [Full PRD](docs/bitcoin-visual-learning-prd.md)
