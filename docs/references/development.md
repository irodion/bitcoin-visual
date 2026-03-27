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

## Known Quirks

- **pnpm + React 19**: `.npmrc` has `public-hoist-pattern` for `react` and `react-dom` to prevent duplicate React instances in tests.
- **VitePlus `vite` override**: `package.json` maps `vite` to `@voidzero-dev/vite-plus-core`. Peer dependency warnings from plugins are expected and harmless.
- **Tailwind v4**: No `tailwind.config.ts` — all customization is CSS-first via `@theme {}` in `src/index.css`.
