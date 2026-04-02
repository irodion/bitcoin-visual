# Testing Guide

## Setup

- **Framework**: Vitest 4 + @testing-library/react + jsdom
- **Setup file**: `src/test-setup.ts` (imports `@testing-library/jest-dom`)
- **Config**: in `vite.config.js` under `test` block
- **Run once**: `vp test run`
- **Watch mode**: `vp test`

## React 19 Act Wrapper

Every `render()` call must be wrapped in `await act(async () => { ... })` to avoid act warnings:

```tsx
import { render, screen, act } from "@testing-library/react";

it("renders", async () => {
  await act(async () => {
    render(<MyComponent />);
  });
  expect(screen.getByText("...")).toBeInTheDocument();
});
```

## jsdom Limitations

### `navigator.clipboard` does not exist

jsdom does not provide `navigator.clipboard`. Attempting to mock it with `Object.assign`, `vi.stubGlobal`, `vi.spyOn`, or `Object.defineProperty` on `navigator` is unreliable — the mock either fails to bind or is ignored by the component's runtime scope.

**Do**: Test observable behavior (e.g., icon changes from clipboard to checkmark) rather than asserting the mock was called. If you must provide a clipboard stub so the promise chain resolves, guard it:

```tsx
if (!navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
}
```

**Don't**: Write `expect(navigator.clipboard.writeText).toHaveBeenCalledWith(...)` — it will fail.

## Responsive Duplicates

Components that render different layouts for mobile and desktop (e.g., `hidden md:flex` + `md:hidden` patterns) will have duplicate elements in the DOM — duplicate text, duplicate `aria-label` values, duplicate roles. Any singular query (`getByText`, `getByLabelText`, `getByRole`) throws when it finds multiple matches.

**Do**: Use the `*AllBy*` variant for any query that might match responsive duplicates:

```tsx
// Text duplicates
const matches = screen.getAllByText("Theory content");
expect(matches.length).toBeGreaterThanOrEqual(1);

// aria-label duplicates (e.g., ConceptChain renders each node in desktop + mobile)
const links = screen.getAllByLabelText("Hash Playground, recommended");
expect(links.some((el) => el.querySelector(".ring-2"))).toBe(true);
```

This applies to `getByText`, `getByLabelText`, `getByRole`, and any other query where the same semantic element renders in both responsive variants.

## Router-Dependent Components

Components that use `<Link>` or other react-router-dom primitives must be wrapped in a router during tests. Use a helper:

```tsx
import { MemoryRouter } from "react-router-dom";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}
```

Only use this wrapper when the component imports from `react-router-dom`. Pure components don't need it.

## Formatting Before Testing

Always run `vp check --fix` before `vp test run`. Oxfmt may reformat files written by hand or by AI, and uncommitted formatting diffs can cause confusion when debugging test failures.
