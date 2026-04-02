# Bitcoin Visual

An interactive, self-contained PWA that lets you **feel** how Bitcoin works — from a raw private key all the way to a broadcast multisig transaction. Every screen is a live sandbox: change an input, watch all downstream values ripple and update in real time.

No backend. No registration. Runs offline after first load.

## Modules

| #   | Module                  | What you learn                                                                |
| --- | ----------------------- | ----------------------------------------------------------------------------- |
| 1   | **Hash Playground**     | SHA-256 properties: determinism, avalanche effect, one-wayness                |
| 2   | **Keys & Addresses**    | Entropy → private key → public key (secp256k1) → Bitcoin address              |
| 3   | **UTXO & Transactions** | UTXO model, transaction building, fee mechanics, TXID computation             |
| 4   | **Blockchain & Mining** | Block structure, proof-of-work, Merkle trees, chain invalidation              |
| 5   | **HD Wallet Tree**      | BIP39 mnemonic → BIP32 derivation paths → child keys                          |
| 6   | **Multisig Vault**      | 2-of-3 multisig script, P2WSH addresses, PSBT signing flow                    |
| 7   | **Attack Lab**          | Nonce reuse key extraction, xpub+child-key leak, weak entropy, rainbow tables |

All cryptographic operations run client-side using audited libraries (`@noble/hashes`, `@noble/curves`, `@scure/bip32`, `@scure/bip39`). Every intermediate value is inspectable — nothing is simulated or faked.

## Quick Start

```bash
# Install VitePlus CLI (one-time)
curl -fsSL https://vite.plus | bash

# Install dependencies
pnpm install

# Start dev server
vp dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

```bash
vp dev              # Development server with HMR
vp build            # TypeScript check + production build
vp check            # Lint + format + typecheck (Oxlint, Oxfmt)
vp test             # Run tests in watch mode
vp test run         # Run tests once
vp preview          # Preview production build
```

## Tech Stack

| Layer     | Choice                                                             |
| --------- | ------------------------------------------------------------------ |
| Toolchain | [VitePlus](https://viteplus.dev/) (Vite + Oxlint + Oxfmt + Vitest) |
| UI        | React 19 + TypeScript                                              |
| Routing   | React Router v7 (lazy-loaded)                                      |
| Styling   | Tailwind CSS v4                                                    |
| Crypto    | @noble/hashes, @noble/curves, @scure/bip32, @scure/bip39           |
| Animation | Framer Motion                                                      |
| State     | Zustand                                                            |
| PWA       | vite-plugin-pwa (Workbox)                                          |

## Security

- All keys are generated in-browser, held in memory only, and lost on page refresh
- Zero network requests at runtime — fully offline after first load
- Attack Lab uses fresh keys with a non-dismissible disclaimer on every screen
- Pre-push hooks run [semgrep](https://semgrep.dev/) (static analysis) and [vet](https://github.com/safedep/vet) (dependency vulnerabilities)

## License

[GPLv3](LICENSE)
