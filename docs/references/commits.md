# Commit Guidelines

## Message Format

```
<type>: <short description>

<optional body>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Pre-commit Checks

Every commit automatically runs `vp check --fix` on staged files (Oxlint + Oxfmt + TypeScript). If the hook fails, fix the issues and commit again — do not use `--no-verify`.

## Pre-push Checks

Every push runs semgrep (static analysis) and vet (dependency vulnerabilities). These take ~1-2 minutes combined.

## What NOT to Commit

- `node_modules/`, `dist/` (in .gitignore)
- `.env` files or secrets
- `.DS_Store` (in .gitignore)
