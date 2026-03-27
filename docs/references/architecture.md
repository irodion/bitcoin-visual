# Architecture

## Project Structure

```
src/
├── modules/              # Feature modules (one per learning topic)
│   ├── 01-hash/          # SHA-256 playground
│   ├── 02-keys/          # Key & address generation
│   ├── 03-utxo/          # UTXO & transaction builder
│   ├── 04-blockchain/    # Blockchain & mining simulator
│   ├── 05-hd-wallet/     # HD wallet tree (BIP32/39)
│   ├── 06-multisig/      # Multisig vault (2-of-3 + PSBT)
│   └── 07-attacks/       # Attack lab (nonce reuse, xpub leak, etc.)
├── pages/                # Top-level pages (Landing)
├── shared/
│   ├── crypto/           # Pure utility wrappers around @noble/*
│   ├── components/       # Shared UI (HexBox, ValueFlowArrow, TheoryPanel, etc.)
│   └── hooks/            # Custom hooks (useDebounce, useCryptoWorker)
├── App.tsx               # Router with lazy-loaded routes
├── main.tsx              # React entry point
└── index.css             # Tailwind v4 + design system tokens
```

## Routes

| Route         | Module              | Component             |
| ------------- | ------------------- | --------------------- |
| `/`           | Landing             | `Landing`             |
| `/hash`       | Hash Playground     | `HashPlayground`      |
| `/keys`       | Keys & Addresses    | `KeysExplorer`        |
| `/utxo`       | UTXO & Transactions | `UTXOBuilder`         |
| `/blockchain` | Blockchain & Mining | `BlockchainSimulator` |
| `/hd-wallet`  | HD Wallet Tree      | `HDWalletExplorer`    |
| `/multisig`   | Multisig Vault      | `MultisigVault`       |
| `/attacks`    | Attack Lab          | `AttackLab`           |

All module routes use `React.lazy()` for code-splitting.

## Key Architectural Decisions

- **Each module is self-contained** — navigable directly by URL, with its own state
- **All crypto is client-side** — uses `@noble/hashes`, `@noble/curves`, `@scure/bip32`, `@scure/bip39`
- **No backend, no network requests at runtime** — fully offline PWA
- **State management** — Zustand for cross-module context, React state for module-internal
- **Styling** — Tailwind CSS v4 (CSS-first config via `@theme`, no tailwind.config.ts)

## Design System Tokens

Defined in `src/index.css` via `@theme`:

| Token             | Value                         |
| ----------------- | ----------------------------- |
| `--color-bg`      | `#08080e`                     |
| `--color-surface` | `#111118`                     |
| `--color-accent`  | `#f59e0b` (amber)             |
| `--color-danger`  | `#ef4444`                     |
| `--color-success` | `#22c55e`                     |
| `--color-info`    | `#3b82f6`                     |
| `--font-sans`     | Geist Sans (fallback: system) |
| `--font-mono`     | IBM Plex Mono                 |

Use as Tailwind classes: `bg-bg`, `text-accent`, `font-mono`, `rounded-card`.
