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

### Every element with `role="button"` must have keyboard support and an accessible name

Add `tabIndex={0}` and an `onKeyDown` handler for Enter and Space at the same time as adding click handlers. Ensure the element has an accessible name: visible text content is preferred; add `aria-label` only when the element has no visible label (e.g., icon-only buttons, single-character spans). Don't defer a11y to review.

### Use literal Unicode characters in JSX strings, never escape sequences

Write `→`, `—`, `′`, `✓`, `✗`, ` ` (non-breaking space) directly — not `\u2192`, `\u2014`, `\u2032`, `\u2713`, `\u2717`, `\u00A0`. Escape sequences are unreadable in source and harder to review.

### Never export non-component runtime values from `.tsx` files

Vite Fast Refresh requires that `.tsx` files export only React components. Type-only exports (`export type`, `export interface`) are safe. If a component file needs a shared runtime utility (e.g., `countBitDifferences`), put it in a separate `.ts` file and import it. Mixing component and runtime utility exports silently breaks HMR.

### When wrapping N callbacks with a pattern, audit all N — not N-1

If `addOne` and `addBatch` are wrapped with `onInteract()`, `reset` must be too. When applying a cross-cutting concern to a set of props/handlers, enumerate them first, then apply to each.

### Never block the main thread for computation — use Web Workers

If an operation runs for more than ~50ms (hashing loops, benchmarks, proof-of-work), move it to a Web Worker. Don't use `requestAnimationFrame` + synchronous loop as a workaround — it still freezes the UI after one frame.

### Guard Web Worker event handlers against stale references

When `startX()` terminates an old worker and creates a new one, the old worker's `onmessage`/`onerror` may still fire. Add `if (workerRef.current !== worker) return;` at the top of every handler to prevent stale events from mutating state.

### In Bash tool calls, run commands through `./node_modules/.bin/vp`

The short `vp` form works in the developer's terminal (shell profile defines the function) but not in Bash tool calls which don't load the profile. Use the full local binary path. Don't fall back to `npx vitest` or `pnpm exec` — they resolve to different binaries.

## Reference Docs

- [Architecture & Design System](docs/references/architecture.md)
- [Development Guide](docs/references/development.md)
- [Testing Guide](docs/references/tests.md)
- [Commit Guidelines](docs/references/commits.md)
- [Full PRD](docs/bitcoin-visual-learning-prd.md)
