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

## Reference Docs

- [Architecture & Design System](docs/references/architecture.md)
- [Development Guide](docs/references/development.md)
- [Testing Guide](docs/references/tests.md)
- [Commit Guidelines](docs/references/commits.md)
- [Full PRD](docs/bitcoin-visual-learning-prd.md)
