# Development Guide

## Prerequisites

- Node.js 22+ (managed by VitePlus: `vp env use 22`)
- pnpm 10+ (bundled with VitePlus)
- [VitePlus CLI](https://viteplus.dev/) — `curl -fsSL https://vite.plus | bash`
- [semgrep](https://semgrep.dev/) — `brew install semgrep` (for pre-push hook)
- [vet](https://github.com/safedep/vet) — `brew install safedep/tap/vet` (for pre-push hook)

## Commands

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `vp dev`         | Start dev server                       |
| `vp build`       | Production build (typecheck + bundle)  |
| `vp check`       | Lint (Oxlint) + format (Oxfmt) + types |
| `vp check --fix` | Auto-fix lint and format issues        |
| `vp test`        | Run tests (Vitest, watch mode)         |
| `vp test run`    | Run tests once                         |
| `vp preview`     | Preview production build locally       |

## Git Hooks

Hooks live in `.vite-hooks/` (configured via `git config core.hooksPath`).

### Pre-commit (`.vite-hooks/pre-commit`)

Runs `vp staged` — applies `vp check --fix` to all staged files.

### Pre-push (`.vite-hooks/pre-push`)

1. **Semgrep** — static analysis on `src/` with auto rules (~213 rules). Blocks on any finding.
2. **Vet** — dependency vulnerability scan via pnpm lockfile (~668 packages). Blocks on critical CVEs.

## Testing

- **Framework**: Vitest 4 + @testing-library/react + jsdom
- **Setup file**: `src/test-setup.ts` (imports `@testing-library/jest-dom`)
- **Config**: in `vite.config.ts` under `test` block
- **React 19 note**: Wrap `render()` calls in `await act(async () => { ... })` to avoid act warnings

```tsx
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

it("renders", async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<MyComponent />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  expect(screen.getByText("...")).toBeInTheDocument();
});
```

## Web Worker Conventions

Workers live in `src/workers/`. Each worker file exports its message type interfaces and handles `self.onmessage`.

### Creating a worker from a component

```typescript
const worker = new Worker(new URL("../../workers/myWorker.ts", import.meta.url), {
  type: "module",
});
```

### Lifecycle pattern (see `useMiningWorker.ts`, `useHashChallengeWorker.ts`)

1. Store worker in `useRef<Worker | null>`
2. Terminate + null ref on unmount via `useEffect` cleanup
3. In `start()`: terminate previous worker, create new, assign handlers, post message
4. Guard every handler: `if (workerRef.current !== worker) return;`
5. In `stop()`: terminate, null ref, reset state to IDLE

### Performance in hot loops

- Avoid `bytesToHex()` / string allocation per iteration — check bytes directly, convert only for display or progress reporting
- Use `performance.now()` for elapsed time, report progress every ~2000 iterations
- Never run tight compute loops on the main thread — always use a worker

## Known Quirks

- **pnpm + React 19**: `.npmrc` has `public-hoist-pattern` for `react` and `react-dom` to prevent duplicate React instances in tests.
- **VitePlus `vite` override**: `package.json` maps `vite` to `@voidzero-dev/vite-plus-core`. Peer dependency warnings from plugins are expected and harmless.
- **Tailwind v4**: No `tailwind.config.ts` — all customization is CSS-first via `@theme {}` in `src/index.css`.
