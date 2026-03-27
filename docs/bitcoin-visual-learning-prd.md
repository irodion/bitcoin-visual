# Bitcoin Visual Learning App — Product Requirements Document

**Project codename:** `BitcoinVault`
**Version:** 1.1 — added Attack Demo module
**Author:** Rodion (for internal pre-onboarding use)
**Reference inspiration:** [blockchain-demo by anders94](https://github.com/anders94/blockchain-demo)
**Date:** 2026-03-26

---

## 1. Vision & Goals

### 1.1 Problem Statement

Existing blockchain demos (e.g., `blockchain-demo`) visualize only the chain structure and proof-of-work. They stop at the surface: blocks, hashes, nonces. They do not touch key generation, wallet architecture, multisig, HD derivation, or transaction signing — the exact domain where wallet company developers operate.

### 1.2 Product Vision

An interactive, self-contained PWA that lets a developer **feel** how Bitcoin works — from a raw private key all the way to a broadcast multisig transaction. Every screen is a live sandbox: change an input, watch all downstream values ripple and update in real time. No backend. No registration. Runs offline after first load.

### 1.3 Success Criteria

| Metric                                                           | Target |
| ---------------------------------------------------------------- | ------ |
| Lighthouse PWA score                                             | ≥ 90   |
| Works fully offline                                              | ✅     |
| Each module teaches one concept by **doing**                     | ✅     |
| Mobile-responsive                                                | ✅     |
| No external API calls at runtime                                 | ✅     |
| All crypto ops done client-side (noble-curves, noble-hashes)     | ✅     |
| Attack demos run real math — no faking, no mocking               | ✅     |
| Prominent "learning tool only" disclaimer on every attack screen | ✅     |

---

## 2. Target Users

**Primary:** Mid-to-senior C++/backend engineers onboarding to a crypto wallet company. They understand code and systems thinking. They are NOT visual learners who need cartoons — they want to see **real values** change.

**Secondary:** Crypto-curious developers wanting to understand wallet internals beyond "blockchain is a linked list."

---

## 3. Technology Stack

| Layer             | Choice                                         | Rationale                                            |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Build tool        | **Vite 5**                                     | Fast HMR, native ESM, first-class PWA support        |
| UI Framework      | **React 18**                                   | Component model ideal for reactive value propagation |
| PWA plugin        | **vite-plugin-pwa** (Workbox)                  | Offline cache, manifest, install prompt              |
| Crypto primitives | **@noble/hashes** + **@noble/curves**          | Audited, pure JS, no WASM deps, zero network         |
| BIP32/BIP39       | **@scure/bip32** + **@scure/bip39**            | Same noble ecosystem, audited                        |
| Styling           | **Tailwind CSS v4**                            | Utility-first, purged, fast                          |
| Animation         | **Framer Motion**                              | Smooth transitions between derivation steps          |
| State             | **Zustand**                                    | Minimal global state for cross-module context        |
| Testing           | **Vitest** + **Testing Library**               | Unit tests for all crypto utility functions          |
| Deployment        | **Static hosting** (Cloudflare Pages / Vercel) | Zero server needed                                   |

**Key constraint:** All cryptographic operations MUST use `@noble/*` libraries. No `window.crypto.subtle` directly for pedagogical ops — values must be inspectable at every intermediate step.

---

## 4. App Architecture

```
src/
├── modules/
│   ├── 01-hash/           # Step 1 – Hash Playground
│   ├── 02-keys/           # Step 2 – Key & Address Generator
│   ├── 03-utxo/           # Step 3 – UTXO & Transaction Builder
│   ├── 04-blockchain/     # Step 4 – Blockchain & Mining Simulator
│   ├── 05-hd-wallet/      # Step 5 – HD Wallet Tree (BIP32/39)
│   ├── 06-multisig/       # Step 6 – Multisig Vault (2-of-3 + PSBT)
│   └── 07-attacks/        # Step 7 – Attack Lab (nonce reuse, xpub leak, weak entropy, rainbow)
├── shared/
│   ├── crypto/            # Pure utility wrappers around noble-*
│   │                      # includes attack math: ecdsaNonceReuse, xpubChildLeak
│   ├── components/        # Shared UI (HexBox, ValueFlowArrow, CopyButton)
│   └── hooks/             # useDebounce, useCryptoWorker
├── App.tsx
└── main.tsx
```

**Cross-cutting principles:**

- Each module is a **fully self-contained route** — navigable directly by URL.
- Every module has a **Theory Panel** (collapsible sidebar) and a **Sandbox Panel** (main area).
- Values that flow between steps are shown with animated arrows labeled with their transformation name (e.g., `SHA-256 ↓`, `secp256k1 ↓`).
- A global **"What did I just do?"** tooltip appears on hover over any computed value, explaining its role.

---

## 5. Navigation & Information Architecture

```
/                       → Landing / module map
/hash                   → Module 1: Hash Playground
/keys                   → Module 2: Keys & Addresses
/utxo                   → Module 3: UTXO & Transactions
/blockchain             → Module 4: Blockchain & Mining
/hd-wallet              → Module 5: HD Wallet Tree
/multisig               → Module 6: Multisig Vault
/attacks                → Module 7: Attack Lab
```

A persistent left sidebar (collapsible on mobile) shows module progress and a "concept chain" showing how modules build on each other.

---

## 6. Detailed Module Specifications

---

### MODULE 1 — Hash Playground

**Route:** `/hash`
**Learning goal:** Understand SHA-256 properties: determinism, avalanche effect, one-wayness, fixed output length.

#### Panels

**Left: Theory Panel**

- Collapsible. Contains a concise explanation of SHA-256, its role in Bitcoin (address derivation, block hashing, TXID), and the four properties.
- A "Why does Bitcoin double-hash (SHA-256d)?" expandable callout.

**Main: Sandbox**

```
┌─────────────────────────────────────────────────────┐
│  INPUT                                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ Type anything here...                         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  SHA-256  ↓                                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ a9b3f... (64 hex chars, live update)          │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  SHA-256 again (SHA-256d)  ↓                        │
│  ┌───────────────────────────────────────────────┐  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [ Avalanche Demo ]  [ Random Input ]               │
└─────────────────────────────────────────────────────┘
```

**Avalanche Demo mode:**

- Shows two text inputs side-by-side. One is user-controlled, one mirrors it but with the last character toggled.
- Both SHA-256 outputs are shown below, with differing bits highlighted in red.
- A counter shows "N bits differ (out of 256)".

---

### MODULE 2 — Keys & Address Generator

**Route:** `/keys`
**Learning goal:** Understand the full pipeline: random entropy → private key → public key (secp256k1) → Bitcoin address (SHA-256 + RIPEMD-160 + Base58Check).

#### Visual Pipeline (top-to-bottom flow)

```
[ 🎲 Generate Entropy (32 bytes) ]
         │
         ▼  (is a valid secp256k1 scalar?)
[ Private Key ] ──── hex display, copy button
         │
         ▼  secp256k1 point multiplication: k · G
[ Public Key (compressed, 33 bytes) ] ──── 02/03 prefix explained
         │
         ▼  SHA-256 → RIPEMD-160
[ Public Key Hash (20 bytes) ]
         │
         ▼  version byte + checksum + Base58Check
[ Bitcoin Address (P2PKH) ]  ──── starts with "1"
         │
         ▼  (SegWit)  Bech32-encode
[ SegWit Address (P2WPKH) ]  ──── starts with "bc1q"
```

**Each box:**

- Shows the raw value in hex.
- Has a hover tooltip: "What is this? Why does it exist?"
- Has a "How was this computed?" expandable showing the formula/algorithm name.
- Animates (fade-in, slide down) when a new key is generated.

**Controls:**

- `[ Generate Random Key ]` — generates cryptographically random entropy.
- `[ Use Custom Entropy ]` — lets user paste a 64-char hex string (useful for teaching that "any 32 bytes = a private key").
- Warning banner shown when entropy looks weak (e.g., all zeros, sequential bytes).

---

### MODULE 3 — UTXO & Transaction Builder

**Route:** `/utxo`
**Learning goal:** Understand the UTXO model, how inputs consume UTXOs, outputs create new UTXOs, and how change works. Understand txid computation.

#### Left Panel: UTXO Pool

A visual "wallet" showing a list of colored UTXO coins:

```
 [●] UTXO-1:  0.5 BTC   (from: tx_abc123…, vout: 0)
 [●] UTXO-2:  0.3 BTC   (from: tx_def456…, vout: 1)
 [○] UTXO-3:  0.1 BTC   (from: tx_ghi789…, vout: 0)
```

User can click UTXOs to "select" them as inputs. Selected ones glow.

#### Right Panel: Transaction Builder

```
INPUTS  (selected UTXOs)        OUTPUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UTXO-1: 0.5 BTC      →  Recipient:  0.4 BTC
UTXO-2: 0.3 BTC      →  Change:     0.39 BTC
                        Fee:         0.01 BTC  ← auto-calc
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total In: 0.8 BTC        Total Out: 0.8 BTC ✓
```

**Bottom: Transaction Hex Inspector**
Shows the raw serialized transaction in hex, with hoverable segments:

- Version bytes highlighted yellow
- Input count, inputs highlighted blue
- Output count, outputs highlighted green
- Locktime highlighted gray

**TXID Panel:**

```
Serialized TX (hex) → SHA-256 → SHA-256 → TXID (little-endian)
```

Each step shows the intermediate value. The "little-endian" reversal step is explicitly called out (a common gotcha).

**SegWit toggle:**
Toggle between Legacy (P2PKH) and SegWit (P2WPKH) transaction formats. The witness field appears/disappears, and the TXID computation path changes (wtxid vs txid shown).

---

### MODULE 4 — Blockchain & Mining Simulator

**Route:** `/blockchain`
**Learning goal:** Understand block structure, previous-hash linkage, Merkle root, proof-of-work, and chain invalidation.

#### Inspired by blockchain-demo but extended:

**Block visualization (horizontal chain):**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Block #0     │    │ Block #1     │    │ Block #2     │
│ (Genesis)    │───▶│              │───▶│              │
│ Prev: 0000…  │    │ Prev: ████…  │    │ Prev: ████…  │
│ Nonce: 12345 │    │ Nonce: 67890 │    │ Nonce: ░░░░  │
│ Merkle: ████ │    │ Merkle: ████ │    │ Merkle: ████ │
│ Hash:  0000… │    │ Hash:  0000… │    │ INVALID ❌   │
└──────────────┘    └──────────────┘    └──────────────┘
```

- Editing any field in a block turns that block and all following blocks **red** (invalid).
- `[ Mine ]` button runs a live nonce increment loop with a counter showing iterations/second.
- Difficulty slider (leading zeros required: 1–5). Visual feedback showing how exponentially harder mining becomes.
- Merkle tree panel: click on a block to expand and see the Merkle tree of its transactions.

**Merkle Proof demo:**

- Select a transaction in the Merkle tree.
- App highlights the minimum sibling hashes needed to prove inclusion (SPV proof path).
- Shows: "To verify TX-2 is in this block, you only need 2 hashes, not all 8 transactions."

---

### MODULE 5 — HD Wallet Tree (BIP32 / BIP39)

**Route:** `/hd-wallet`
**Learning goal:** Understand mnemonic → seed → master key → derivation paths → child keys. Understand why hardened derivation exists.

#### Top: Seed Generation Panel

```
[ Generate Mnemonic (12 words) ]

  word1  word2  word3  word4  word5  word6
  word7  word8  word9  word10 word11 word12

  Optional Passphrase: [____________]

  ↓  PBKDF2 (2048 iterations, HMAC-SHA-512)

  Seed (64 bytes / 128 hex chars):
  [████████████████████████████████████████]

  ↓  HMAC-SHA-512 with key "Bitcoin seed"

  Master Private Key (xprv):  [████…]
  Master Chain Code:          [████…]
```

Each transformation step animates with a labeled arrow.

#### Middle: Derivation Path Builder

```
Path:  m / 44' / 0' / 0' / 0 / [index: 0  ▲▼]
            ↑       ↑      ↑      ↑      ↑
         purpose  coin  account change  index

       [  ' = hardened  ]  [  no ' = normal  ]
```

Clicking each segment of the path shows an inline explanation: "Why is account hardened? → xpub isolation."

#### Bottom: Derived Key Tree (visual tree diagram)

```
m
└── m/44'
    └── m/44'/0'
        └── m/44'/0'/0'  ← account xpub shown here
            ├── m/44'/0'/0'/0   (external / receiving)
            │   ├── m/44'/0'/0'/0/0  → Address: bc1q…
            │   ├── m/44'/0'/0'/0/1  → Address: bc1q…
            │   └── m/44'/0'/0'/0/2  → Address: bc1q…
            └── m/44'/0'/0'/1   (internal / change)
                └── m/44'/0'/0'/1/0  → Address: bc1q…
```

**xpub Attack Vector callout:**
A red warning banner when xpub is shown:

> ⚠️ **Security note:** If an attacker gets this xpub AND any non-hardened child private key, they can derive ALL sibling private keys. Never expose account xpub + child private keys together.

User can toggle the tree between showing private keys (with a "Reveal" button) and showing only public keys/addresses (safe mode, default).

---

### MODULE 6 — Multisig Vault (2-of-3 + PSBT Flow)

**Route:** `/multisig`
**Learning goal:** Understand 2-of-3 multisig script construction, P2WSH addresses, redeem script storage, and the PSBT signing flow.

#### Sub-tab 1: Vault Setup

```
┌──────────────────────────────────────────────────────────┐
│  MULTISIG VAULT SETUP — 2 of 3                          │
│                                                          │
│  Cosigner 1 (You — Phone)   xpub1: [████…]  [Generate] │
│  Cosigner 2 (Hardware HSM)  xpub2: [████…]  [Generate] │
│  Cosigner 3 (Cold Backup)   xpub3: [████…]  [Generate] │
│                                                          │
│  ↓  Derive child pubkeys at m/0/0                       │
│                                                         │
│  Redeem Script (OP_2 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG)
│  [██████████████████████████████████████████]            │
│                                                          │
│  ↓  SHA-256 → RIPEMD-160 (P2SH) OR SHA-256 only (P2WSH)│
│                                                          │
│  P2WSH Address (bc1q…): [████████████████]              │
│                                                          │
│  ⚠️ Store the redeem script separately! Losing it means │
│     losing access to funds even with all private keys.  │
└──────────────────────────────────────────────────────────┘
```

#### Sub-tab 2: PSBT Signing Flow

A stepper/wizard that walks through signing:

```
Step 1: Create PSBT
  ┌─ Unsigned TX (inputs, outputs) + redeem script metadata ─┐
  │ PSBT hex: [████…]  [Copy to clipboard]                   │
  └──────────────────────────────────────────────────────────┘

Step 2: Cosigner 1 signs (Phone)
  [ Sign with Cosigner 1 Private Key ]
  ┌─ PSBT now contains: 1 partial signature ──────────────────┐
  │ Signatures:  [✅ Cosigner 1]  [⬜ Cosigner 2]  [⬜ Cosigner 3] │
  └──────────────────────────────────────────────────────────┘

Step 3: Cosigner 2 signs (HSM)
  [ Sign with Cosigner 2 Private Key ]
  ┌─ PSBT now contains: 2 partial signatures ─────────────────┐
  │ Signatures:  [✅ Cosigner 1]  [✅ Cosigner 2]  [⬜ Cosigner 3] │
  │ Threshold met! Ready to finalize.                         │
  └──────────────────────────────────────────────────────────┘

Step 4: Finalize & Broadcast
  [ Finalize PSBT → Extract signed TX ]
  Final TX hex: [████…]
  TXID: [████…]
  [ Broadcast (simulated) ]
```

**After broadcast (simulated):**

- Animated UTXO state update: old UTXOs disappear, new UTXOs appear.
- Shows which UTXOs were consumed, which were created.

---

---

### MODULE 7 — Attack Lab

**Route:** `/attacks`
**Learning goal:** See real exploits execute in real time using the same cryptographic primitives used in all previous modules. Every attack runs the actual math — nothing is simulated or faked. The goal is not to enable attacks but to make the _consequences_ viscerally clear so they are never forgotten in production code.

**Persistent disclaimer banner (cannot be dismissed, shown on every sub-tab):**

> ⚠️ **Learning tool only.** All keys used here are generated fresh in-browser, are never stored, and have no real funds attached. This module exists so you understand _why_ certain wallet code patterns are dangerous — not to attack real systems.

---

#### SUB-TAB 1 — ECDSA Nonce Reuse (★ primary)

**Concept:** If the same nonce `k` is used to sign two different messages with the same private key, an observer can algebraically recover the private key from the two public signatures alone. This is pure algebra — no brute force, no guessing. It takes milliseconds.

**Real-world anchors shown in the theory panel:**

- Sony PS3 (2010): the console firmware used a constant `k` for all ECDSA signatures. Every signature contained the same `r` value. Private key extracted, entire platform jailbroken.
- Android Bitcoin Wallet (2013): `SecureRandom` was seeded with insufficient entropy on some Android 4.x devices, causing nonce reuse across transactions. ~$5,600 drained.

**Layout:**

```
┌─── SETUP ──────────────────────────────────────────────────────┐
│  Private key (auto-generated):  [████ hex ████]  [Regenerate]  │
│  Public key (derived):          [████ hex ████]                 │
│                                                                  │
│  Message 1:  [Sign me once___________]                          │
│  Message 2:  [Sign me twice__________]                          │
│                                                                  │
│  Nonce mode:  ( ● Same nonce k )  ( ○ Different nonce )         │
│                                                                  │
│  [ Sign Both Messages ]                                          │
└──────────────────────────────────────────────────────────────────┘

┌─── SIGNATURES ─────────────────────────────────────────────────┐
│  Sig 1:  r = [████]   s₁ = [████]                              │
│  Sig 2:  r = [████]   s₂ = [████]                              │
│                                                                  │
│  r₁ === r₂?  ✅ YES — same nonce detected                       │
└──────────────────────────────────────────────────────────────────┘

┌─── ATTACK ─────────────────────────────────────────────────────┐
│  Step 1: recover k                                              │
│    k = (z₁ - z₂) · (s₁ - s₂)⁻¹  mod n                        │
│    k = [████ computed live ████]                                │
│                                                                  │
│  Step 2: recover private key                                    │
│    privkey = (s₁ · k - z₁) · r⁻¹  mod n                       │
│    privkey = [████ computed live ████]  ← 🔴 MATCH             │
│                                                                  │
│  privkey matches original?  ✅ YES                              │
└──────────────────────────────────────────────────────────────────┘
```

**"Different nonce" mode:** When the user switches to different nonces, `r₁ ≠ r₂`. The attack panel shows the formula producing garbage. The "MATCH" badge disappears. The contrast is the lesson.

**Step-by-step reveal mode:** A "Walk me through this" toggle that reveals each formula line one at a time with an explanation before proceeding. Designed for first-time viewers.

---

#### SUB-TAB 2 — xpub + Child Private Key Leak (★ primary)

**Concept:** In BIP32 normal (non-hardened) derivation, a child private key and the parent xpub contain enough information to reconstruct the parent private key — and therefore all sibling private keys. Hardened derivation (`'`) was introduced specifically to close this gap.

**Real-world context (theory panel):**

- Any wallet that exposes an account xpub for watch-only purposes (exchange cold wallets, multisig coordinators) while a single non-hardened child private key leaks creates total account compromise.
- This is why BIP44 mandates hardened derivation for the purpose, coin type, and account levels (`m/44'/0'/0'`).

**Layout:**

```
┌─── WALLET SETUP ───────────────────────────────────────────────┐
│  Master seed (auto-generated):  [████]  [Regenerate]           │
│                                                                  │
│  Derivation mode:  ( ● Normal m/0/N )  ( ○ Hardened m/0'/N )   │
│                                                                  │
│  Account xpub  (m/0):   [████ xpub ████]  ← "safe to share"   │
│  Child private key at index 5  (m/0/5):  [ Reveal ]            │
└──────────────────────────────────────────────────────────────────┘

┌─── ATTACK ─────────────────────────────────────────────────────┐
│  Given: xpub(m/0)  +  privkey(m/0/5)                           │
│                                                                  │
│  Step 1: extract parent chain code from xpub                    │
│    chainCode = [████]                                           │
│                                                                  │
│  Step 2: derive parent private key                              │
│    parentPriv = childPriv - HMAC(chainCode, pubkey ‖ index)     │
│    parentPriv = [████ computed live ████]                       │
│                                                                  │
│  Step 3: re-derive all siblings                                 │
│    m/0/0  privkey: [████]  address: [bc1q…]                    │
│    m/0/1  privkey: [████]  address: [bc1q…]                    │
│    m/0/2  privkey: [████]  address: [bc1q…]                    │
│    ...all N addresses now fully compromised                     │
└──────────────────────────────────────────────────────────────────┘
```

**Hardened mode toggle:** When user switches to hardened derivation (`m/0'/N`), the attack panel shows the HMAC input now includes the _private_ key (not public key), making the chain code derivation impossible without the parent private key. The "computed live" value becomes `CANNOT DERIVE — hardened path`. Green "Protected ✅" badge appears.

**Side-by-side comparison view:** A "Compare" button splits the screen into Normal (left, compromised) and Hardened (right, protected) showing the derivation paths and attack outcome simultaneously.

---

#### SUB-TAB 3 — Weak Entropy / Brain Wallet (secondary)

**Concept:** A private key is just a 256-bit number. Any number in range `[1, n-1]` is a valid key. If that number is predictable (low-entropy RNG, a dictionary word, a sequential counter), an attacker can generate the same key independently and drain the address.

**Layout:**

```
┌─── ENTROPY SOURCE ─────────────────────────────────────────────┐
│  Mode:  ( ● Phrase → SHA-256 )  ( ○ Custom 32 bytes )          │
│                                                                  │
│  Passphrase:  [correct horse battery staple_____]               │
│  → SHA-256:   [████ privkey ████]                               │
│  → Address:   [1xxxxxx…]                                        │
└──────────────────────────────────────────────────────────────────┘

┌─── KNOWN BRAIN WALLET HALL OF SHAME ───────────────────────────┐
│  These exact passphrases have been precomputed and swept:       │
│                                                                  │
│  "password"       → [address]  Balance swept: ✅               │
│  "abc"            → [address]  Balance swept: ✅               │
│  "bitcoin"        → [address]  Balance swept: ✅               │
│  "Satoshi"        → [address]  Balance swept: ✅               │
│                                                                  │
│  [Check your phrase against known swept list]                   │
└──────────────────────────────────────────────────────────────────┘
```

The "Hall of Shame" uses a small hardcoded list of historically swept brain wallet addresses (public info, no live lookups). The point is visceral: these were real Bitcoin, now gone.

Contrast panel: "Cryptographic RNG" button generates a fresh key using `window.crypto.getRandomValues`, with a counter showing "~2²⁵⁶ possible keys — not guessable in the lifetime of the universe."

---

#### SUB-TAB 4 — Rainbow Table / Unsalted Hash (secondary)

**Concept:** If passwords are stored as raw `SHA-256(password)` with no salt, an attacker with a precomputed table of `SHA-256(word)` for every word in a dictionary can reverse any hash instantly — not by breaking SHA-256, but by looking it up.

**Layout:**

```
┌─── THE ATTACK ─────────────────────────────────────────────────┐
│  Stolen hash (from a database leak):                            │
│  [5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d] │
│                                                                  │
│  Precomputed rainbow table (50 common passwords):               │
│  ┌──────────────┬──────────────────────────────────────────┐   │
│  │ "admin"      │ 8c6976e5b5410415bde908bd4dee15dfb167a9c… │   │
│  │ "password"   │ 5e884898da28047151d0e56f8dc6292773603d… ← MATCH │
│  │ "123456"     │ 8d969eef6ecad3c29a3a629280e686cf0c3f5d… │   │
│  └──────────────┴──────────────────────────────────────────┘   │
│                                                                  │
│  Cracked in: 0ms   Result: "password"                          │
└──────────────────────────────────────────────────────────────────┘

┌─── THE FIX: SALTING ───────────────────────────────────────────┐
│  Salt (random, stored alongside hash): [a7f3c9…]               │
│  Salted hash: SHA-256("password" + salt) = [completely different] │
│                                                                  │
│  Same rainbow table now useless — attacker must rebuild it      │
│  for every unique salt. Cost: ~2³² × table size per user.       │
└──────────────────────────────────────────────────────────────────┘
```

User can type any word and watch it appear (or not) in the rainbow table, then toggle salting on/off to see the hash change completely.

---

## 7. Shared Components

### HexBox

A styled hex value display with:

- Monospace font
- Copy-to-clipboard button
- Optional "decode" panel (hover shows what each byte segment means)
- Color coding by value type (private key = red/danger, public = blue, address = green)

### ValueFlowArrow

An animated arrow between computation steps:

- Label shows algorithm name (e.g., "SHA-256", "secp256k1 · G", "Base58Check")
- On hover: shows formula or pseudocode
- Animates when value changes (pulse effect)

### TheoryPanel

- Collapsible left sidebar
- Contains: concept explanation, "Why this matters in wallet code" callout, and link to further reading
- Persists open/closed state in localStorage

### SecurityCallout

Red/amber warning box used for:

- xpub attack vector warnings
- Private key display warnings
- "Never do this in production" notes

---

## 8. PWA Requirements

| Feature        | Implementation                               |
| -------------- | -------------------------------------------- |
| Service Worker | Workbox via `vite-plugin-pwa`                |
| Manifest       | App name, icons (192/512), theme color       |
| Offline mode   | Full precache of all JS/CSS/assets           |
| Install prompt | Custom `beforeinstallprompt` handler         |
| Update flow    | Show "New version available, reload?" banner |
| Cache strategy | Cache-first for all static assets            |

---

## 9. Implementation Plan

---

### STEP 1 — Project Scaffold

```json
{
  "step": 1,
  "title": "Project Scaffold & Tooling",
  "description": "Initialize Vite + React + TypeScript project with all dependencies, PWA plugin, Tailwind, and routing.",
  "commands": [
    "npm create vite@latest bitcoin-vault -- --template react-ts",
    "npm install tailwindcss @tailwindcss/vite framer-motion zustand react-router-dom",
    "npm install @noble/hashes @noble/curves @scure/bip32 @scure/bip39",
    "npm install -D vite-plugin-pwa vitest @testing-library/react"
  ],
  "files_created": [
    "vite.config.ts (with VitePWA plugin + Tailwind plugin)",
    "public/manifest.webmanifest",
    "public/icons/ (192x192, 512x512 PNG)",
    "src/App.tsx (react-router-dom routes for all 6 modules)",
    "src/main.tsx",
    "tailwind.config.ts",
    "src/index.css (global CSS variables + base styles)"
  ],
  "acceptance_criteria": [
    "npm run dev serves the app at localhost:5173",
    "All 6 routes (/hash, /keys, /utxo, /blockchain, /hd-wallet, /multisig) return 200 with placeholder content",
    "Lighthouse PWA check shows manifest and service worker registered",
    "App installs as PWA in Chrome (install prompt appears)",
    "npm run build produces a dist/ folder with no TS errors",
    "npm run test passes (empty test suite is OK at this stage)"
  ]
}
```

---

### STEP 2 — Shared Crypto Utilities

```json
{
  "step": 2,
  "title": "Shared Crypto Utility Layer",
  "description": "Implement all cryptographic operations as pure, testable functions wrapping @noble/* libraries. No UI in this step.",
  "files_created": [
    "src/shared/crypto/hash.ts",
    "src/shared/crypto/keys.ts",
    "src/shared/crypto/address.ts",
    "src/shared/crypto/bip39.ts",
    "src/shared/crypto/bip32.ts",
    "src/shared/crypto/multisig.ts",
    "src/shared/crypto/psbt.ts",
    "src/shared/crypto/transaction.ts"
  ],
  "key_functions": {
    "hash.ts": [
      "sha256(input: Uint8Array): Uint8Array",
      "sha256d(input: Uint8Array): Uint8Array",
      "ripemd160(input: Uint8Array): Uint8Array",
      "hash160(input: Uint8Array): Uint8Array  // SHA-256 then RIPEMD-160"
    ],
    "keys.ts": [
      "generatePrivateKey(): Uint8Array",
      "privateKeyToPublicKey(privKey: Uint8Array, compressed?: boolean): Uint8Array",
      "isValidPrivateKey(privKey: Uint8Array): boolean"
    ],
    "address.ts": [
      "publicKeyToP2PKHAddress(pubKey: Uint8Array, network?: 'mainnet'|'testnet'): string",
      "publicKeyToP2WPKHAddress(pubKey: Uint8Array, network?: 'mainnet'|'testnet'): string",
      "base58CheckEncode(payload: Uint8Array): string"
    ],
    "bip39.ts": [
      "generateMnemonic(wordCount?: 12|24): string",
      "mnemonicToSeed(mnemonic: string, passphrase?: string): Promise<Uint8Array>",
      "validateMnemonic(mnemonic: string): boolean"
    ],
    "bip32.ts": [
      "seedToMasterKey(seed: Uint8Array): HDKey",
      "deriveChild(parent: HDKey, index: number, hardened?: boolean): HDKey",
      "hdKeyToXPub(key: HDKey): string",
      "hdKeyToXPrv(key: HDKey): string"
    ],
    "multisig.ts": [
      "createMultisigRedeemScript(pubKeys: Uint8Array[], m: number): Uint8Array",
      "redeemScriptToP2WSHAddress(redeemScript: Uint8Array): string",
      "redeemScriptToP2SHAddress(redeemScript: Uint8Array): string"
    ],
    "attacks.ts": [
      "signWithNonce(privKey: Uint8Array, message: Uint8Array, nonce: Uint8Array): ECDSASignature",
      "recoverNonceFromTwoSigs(sig1: ECDSASignature, z1: bigint, sig2: ECDSASignature, z2: bigint, n: bigint): bigint",
      "recoverPrivKeyFromNonce(sig: ECDSASignature, z: bigint, k: bigint, n: bigint): bigint",
      "xpubChildPrivToParentPriv(xpub: XPub, childPrivKey: Uint8Array, childIndex: number): Uint8Array",
      "deriveAllSiblings(parentPrivKey: Uint8Array, chainCode: Uint8Array, count: number): Uint8Array[]",
      "isHardenedIndex(index: number): boolean"
    ]
  },
  "acceptance_criteria": [
    "100% unit test coverage on all exported functions",
    "sha256('abc') matches known test vector: ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469126195f143d812834",
    "generatePrivateKey() always returns a valid 32-byte secp256k1 scalar",
    "privateKeyToPublicKey produces correct 33-byte compressed pubkey (test against known vectors)",
    "publicKeyToP2PKHAddress('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798') === '1BpEi6DfDAUFd153wiGrvkiKW1EDMLa1x9'  // known genesis pubkey",
    "mnemonicToSeed round-trips correctly with BIP39 test vectors",
    "All functions are pure (no side effects, no global state)",
    "No function imports from any UI layer",
    "signWithNonce(privKey, msg, k) produces deterministic signature matching @noble/curves output for same inputs",
    "recoverPrivKeyFromNonce returns the exact original privKey used — verified against known test fixture",
    "xpubChildPrivToParentPriv recovers parent private key that matches the known master derivation — verified with BIP32 test vectors",
    "isHardenedIndex correctly identifies indices ≥ 0x80000000 as hardened"
  ]
}
```

---

### STEP 3 — Shared UI Components

```json
{
  "step": 3,
  "title": "Shared UI Component Library",
  "description": "Build the reusable UI components used across all modules.",
  "files_created": [
    "src/shared/components/HexBox.tsx",
    "src/shared/components/ValueFlowArrow.tsx",
    "src/shared/components/TheoryPanel.tsx",
    "src/shared/components/SecurityCallout.tsx",
    "src/shared/components/CopyButton.tsx",
    "src/shared/components/ModuleLayout.tsx",
    "src/shared/components/ByteSegmentTooltip.tsx"
  ],
  "design_spec": {
    "theme": "Dark background (#0a0a0f), amber/orange accent (#f59e0b), monospace IBM Plex Mono for hex values, sans-serif Geist for UI text",
    "HexBox": "Dark card, monospace hex in amber, copy icon, optional 'decode' hover panel. Truncation for long values with expand option.",
    "ValueFlowArrow": "Vertical line with centered pill label (algorithm name). Pulse animation (Framer Motion) triggered by value change.",
    "TheoryPanel": "Left panel, 320px wide, dark charcoal (#111118), collapsible. Contains concept title, explanation paragraphs, and optional code snippets.",
    "SecurityCallout": "Red-tinted box with warning icon. Used for private key warnings and security anti-patterns.",
    "ModuleLayout": "Two-column layout: TheoryPanel (left, 320px) + main sandbox (right, flex-grow). Stack vertically on mobile."
  },
  "acceptance_criteria": [
    "HexBox renders any Uint8Array or hex string",
    "HexBox copy button writes hex string to clipboard and shows '✓ Copied' for 2s",
    "ValueFlowArrow animates when its 'value' prop changes (Framer Motion layoutId or animate)",
    "TheoryPanel open/closed state persists in localStorage per module key",
    "ModuleLayout is fully responsive: stacks vertically below 768px",
    "All components pass accessibility audit (keyboard nav, ARIA labels, contrast ≥ 4.5:1)",
    "Storybook stories (optional) or visual snapshot tests for each component"
  ]
}
```

---

### STEP 4 — Module 1: Hash Playground

```json
{
  "step": 4,
  "title": "Module 1 — Hash Playground",
  "route": "/hash",
  "description": "Interactive SHA-256 and SHA-256d demo with live update and avalanche effect visualizer.",
  "files_created": [
    "src/modules/01-hash/HashPlayground.tsx",
    "src/modules/01-hash/AvalancheDemo.tsx",
    "src/modules/01-hash/useHashState.ts"
  ],
  "behavior": {
    "normal_mode": "Single text input. As user types, SHA-256 and SHA-256d update live (debounced 50ms). Both output shown in HexBox. Character counter shown.",
    "avalanche_mode": "Two side-by-side inputs. Right input auto-mirrors left input with last char changed by +1. Both SHA-256 outputs shown. Differing bits highlighted red. Bit difference counter shown. Toggle button switches modes."
  },
  "acceptance_criteria": [
    "SHA-256 output updates within 100ms of user keystroke",
    "SHA-256('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'",
    "Avalanche mode shows bit difference between 0 and 256 for any two inputs",
    "Avalanche mode highlights differing bit positions (not just count) in the hex output",
    "Switching modes does not lose the current input value",
    "Module renders correctly with TheoryPanel open and closed",
    "Theory panel contains explanation of: determinism, avalanche effect, pre-image resistance, fixed output length, SHA-256d rationale"
  ]
}
```

---

### STEP 5 — Module 2: Keys & Address Generator

```json
{
  "step": 5,
  "title": "Module 2 — Keys & Address Generator",
  "route": "/keys",
  "description": "Full key-to-address pipeline: entropy → private key → compressed public key → P2PKH address → P2WPKH address. Each step live and inspectable.",
  "files_created": [
    "src/modules/02-keys/KeyGenerator.tsx",
    "src/modules/02-keys/PipelineStep.tsx",
    "src/modules/02-keys/EntropyInput.tsx",
    "src/modules/02-keys/useKeyPipeline.ts"
  ],
  "pipeline_steps": [
    "Entropy (32 random bytes) — shown in hex",
    "Private Key — validate it's a valid secp256k1 scalar (< curve order)",
    "Public Key (compressed) — prefix 02 or 03 explained with tooltip",
    "Public Key Hash — SHA-256 → RIPEMD-160",
    "P2PKH Address — version byte + checksum + Base58Check",
    "P2WPKH Address — Bech32 encoding"
  ],
  "acceptance_criteria": [
    "Generate Random button produces a new valid private key and cascades all downstream values",
    "Custom entropy input (hex) is validated: shows error if not 64 hex chars or if key >= curve order",
    "All 6 pipeline steps shown with ValueFlowArrow between each",
    "Each step has a HexBox showing the raw value",
    "Each step has a hover tooltip explaining the algorithm used",
    "P2PKH address always starts with '1' on mainnet",
    "P2WPKH address always starts with 'bc1q' on mainnet",
    "Known test vector passes: privkey 0x01 → pubkey 0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
    "SecurityCallout displayed over private key with 'never share' warning",
    "Framer Motion stagger animation on initial pipeline render and on re-generation"
  ]
}
```

---

### STEP 6 — Module 3: UTXO & Transaction Builder

```json
{
  "step": 6,
  "title": "Module 3 — UTXO & Transaction Builder",
  "route": "/utxo",
  "description": "Visual UTXO pool with clickable coin selection, transaction builder, fee calculator, raw hex inspector, and TXID derivation.",
  "files_created": [
    "src/modules/03-utxo/UTXOPlayground.tsx",
    "src/modules/03-utxo/UTXOCoin.tsx",
    "src/modules/03-utxo/TransactionBuilder.tsx",
    "src/modules/03-utxo/TxHexInspector.tsx",
    "src/modules/03-utxo/TxIDPanel.tsx",
    "src/modules/03-utxo/useUTXOState.ts",
    "src/modules/03-utxo/txSerializer.ts"
  ],
  "initial_state": "Preloaded with 4 mock UTXOs of varying amounts (seeded with deterministic fake txids)",
  "behavior": {
    "utxo_selection": "Click UTXO coins to select/deselect. Selected coins glow amber. Running total of selected inputs shown.",
    "output_form": "Recipient address input + amount. Change address auto-filled. Fee auto-calculated as (inputs - outputs).",
    "validation": "Real-time: insufficient funds warning, dust output warning (<546 sat), negative fee warning.",
    "hex_inspector": "Show serialized transaction bytes with color-coded segments. Each segment is hoverable showing field name and byte range.",
    "txid_panel": "Show: raw TX hex → SHA-256 → SHA-256 → byte-reverse → TXID. Each step shown.",
    "segwit_toggle": "Toggle between legacy and SegWit. In SegWit mode, witness field appears in hex, wtxid computation shown alongside txid."
  },
  "acceptance_criteria": [
    "Selecting UTXOs updates total inputs in real time",
    "Fee is always ≥ 0 (validation prevents negative fee)",
    "Serialized TX hex updates whenever any input/output changes",
    "TXID is correct SHA-256d of the legacy serialization (test with known fixture)",
    "SegWit toggle shows/hides witness field and updates wtxid path",
    "Hex inspector segments are correctly identified (version, vin count, vin[0], vout count, vout[0], locktime)",
    "Hovering any hex segment shows field name tooltip",
    "Theory panel covers: UTXO model vs account model, why change outputs exist, fee mechanics, why TXID is little-endian reversed"
  ]
}
```

---

### STEP 7 — Module 4: Blockchain & Mining Simulator

```json
{
  "step": 7,
  "title": "Module 4 — Blockchain & Mining Simulator",
  "route": "/blockchain",
  "description": "Visual chain of blocks with editable fields, real-time hash validation, mining animation, and Merkle tree proof demo.",
  "files_created": [
    "src/modules/04-blockchain/BlockchainSimulator.tsx",
    "src/modules/04-blockchain/Block.tsx",
    "src/modules/04-blockchain/MiningControls.tsx",
    "src/modules/04-blockchain/MerkleTreePanel.tsx",
    "src/modules/04-blockchain/useMiningWorker.ts",
    "src/workers/mining.worker.ts"
  ],
  "initial_state": "3 pre-mined blocks with 3 transactions each at difficulty 2 (hash must start with '00')",
  "behavior": {
    "block_editing": "Any field in any block is editable (data, nonce). Editing invalidates that block and all subsequent blocks (red border + ❌ icon).",
    "mining": "Mine button on any invalid block. Runs in Web Worker to avoid UI freeze. Shows nonce iteration counter live. Stops when hash meets difficulty.",
    "difficulty_slider": "1–5 leading zeros. Visual feedback: shows estimated hashes needed (2^(4*n)).",
    "merkle_panel": "Click block → expand Merkle tree panel. Shows all transactions as leaf nodes. Hashed pairwise upward. Root shown in block header.",
    "spv_proof": "Click any transaction → app highlights the sibling hashes needed to prove inclusion. Shows: 'Proof size: N hashes (not all M transactions)'.",
    "add_transaction": "Each block has an '+ Add TX' button to add a new mock transaction. Merkle root and block hash update instantly (block becomes invalid, needs re-mining)."
  },
  "acceptance_criteria": [
    "Mining Web Worker runs without blocking UI thread (UI remains responsive during mining)",
    "Editing block N invalidates blocks N, N+1, N+2, ... in real time",
    "After mining, hash starts with the required number of leading zeros",
    "Merkle root in block header matches computed Merkle root of displayed transactions",
    "SPV proof path is minimal and correct (log2(n) hashes for n transactions)",
    "Difficulty 1 mines in < 1s on average, difficulty 4 takes a noticeable few seconds",
    "Adding a new transaction to a block updates the Merkle root and marks block invalid",
    "Theory panel covers: block structure, PoW security, why longer chains win, Merkle trees, SPV"
  ]
}
```

---

### STEP 8 — Module 5: HD Wallet Tree

```json
{
  "step": 8,
  "title": "Module 5 — HD Wallet Tree (BIP32/BIP39)",
  "route": "/hd-wallet",
  "description": "Full BIP39 mnemonic to BIP32 derivation tree. Interactive path builder. Visual key tree with reveal/hide for private keys.",
  "files_created": [
    "src/modules/05-hd-wallet/HDWalletExplorer.tsx",
    "src/modules/05-hd-wallet/MnemonicPanel.tsx",
    "src/modules/05-hd-wallet/SeedDerivationPanel.tsx",
    "src/modules/05-hd-wallet/PathBuilder.tsx",
    "src/modules/05-hd-wallet/KeyTreeView.tsx",
    "src/modules/05-hd-wallet/useHDState.ts"
  ],
  "sections": {
    "mnemonic_panel": "Generate or paste mnemonic (12/24 words). Each word shown as a pill with its BIP39 word index. Optional passphrase input. 'Validate' button shows checksum result.",
    "seed_derivation": "Show mnemonic → PBKDF2 (2048 rounds, HMAC-SHA-512, salt='mnemonic'+passphrase) → seed (128 hex chars). Then seed → HMAC-SHA-512(key='Bitcoin seed') → master xprv + chain code.",
    "path_builder": "Segmented path input. Each segment can be toggled hardened/normal with a ' button. Live-derived key shown below path.",
    "key_tree": "BIP44 tree visualization (m/44'/0'/0'). Shows external and change branches. Lists first 5 addresses per branch. Toggle to reveal private keys (requires clicking 'Reveal Private Keys' with SecurityCallout)."
  },
  "acceptance_criteria": [
    "Mnemonic generation produces valid BIP39 mnemonic (validateMnemonic returns true)",
    "Changing passphrase changes the seed (and all derived keys) while keeping the same mnemonic",
    "PBKDF2 derivation matches BIP39 test vectors",
    "Derivation path m/44'/0'/0'/0/0 produces correct address for known test mnemonic",
    "Hardened segments (') show different child keys than non-hardened (same index)",
    "Private keys hidden by default, require explicit 'Reveal' click with SecurityCallout acknowledgment",
    "xpub shown at account level (m/44'/0'/0') with SecurityCallout about xpub+child-privkey attack",
    "Changing any mnemonic word re-derives the entire tree",
    "PBKDF2 derivation runs asynchronously (does not block UI)"
  ]
}
```

---

### STEP 9 — Module 6: Multisig Vault

```json
{
  "step": 9,
  "title": "Module 6 — Multisig Vault (2-of-3 + PSBT)",
  "route": "/multisig",
  "description": "2-of-3 multisig address creation + PSBT step-by-step signing flow. The capstone module combining all previous concepts.",
  "files_created": [
    "src/modules/06-multisig/MultisigVault.tsx",
    "src/modules/06-multisig/VaultSetup.tsx",
    "src/modules/06-multisig/RedeemScriptPanel.tsx",
    "src/modules/06-multisig/PSBTStepper.tsx",
    "src/modules/06-multisig/SignatureTracker.tsx",
    "src/modules/06-multisig/UTXOStateUpdate.tsx",
    "src/modules/06-multisig/useMultisigState.ts"
  ],
  "sub_tabs": ["Vault Setup", "Sign & Broadcast"],
  "vault_setup_behavior": {
    "cosigner_inputs": "3 xpub inputs with 'Generate' buttons. Each generates a fresh HD key and derives child pubkey at m/0/0.",
    "redeem_script": "Auto-constructed: OP_2 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG. Show hex + decoded opcode view.",
    "address_derivation": "Show: redeemScript → SHA-256 → P2WSH address. Also show P2SH path (SHA-256 → RIPEMD-160) as comparison.",
    "redeem_script_warning": "Persistent red callout: 'This redeem script must be backed up separately from your private keys. Without it, funds are unrecoverable even with all private keys.'"
  },
  "psbt_signing_behavior": {
    "step1": "Create PSBT: populate with unsigned TX spending the multisig UTXO + redeem script. Show raw PSBT hex.",
    "step2": "Cosigner 1 signs: derive private key, sign sighash, add partial sig to PSBT. Show updated PSBT hex.",
    "step3": "Cosigner 2 signs: same flow. Threshold met badge appears.",
    "step4": "Finalize: combine partial sigs into witness field. Extract final TX. Show TXID.",
    "step5": "Broadcast (simulated): animate old multisig UTXO disappearing, new UTXOs appearing."
  },
  "acceptance_criteria": [
    "Redeem script is correctly serialized: OP_2 + pk1 + pk2 + pk3 + OP_3 + OP_CHECKMULTISIG",
    "P2WSH address = Bech32(SHA-256(redeemScript)) — verified against known test vector",
    "PSBT starts as unsigned (no signatures in witness)",
    "After each signing step, PSBT hex changes and signature count increments",
    "Finalized TX witness field contains exactly 2 of the 3 valid signatures",
    "Finalized TX is valid (can be verified against redeem script offline)",
    "UTXO state animation plays after 'broadcast'",
    "Theory panel covers: why M-of-N, redeem script storage requirement, PSBT role in hardware wallet flows, P2SH vs P2WSH tradeoffs",
    "SecurityCallout on xpub exchange step: 'In real recovery, exchanging xpubs is a sensitive step — do it in a trusted environment'"
  ]
}
```

---

### STEP 10 — Navigation, Landing Page & Module Map

```json
{
  "step": 10,
  "title": "Landing Page & Navigation Shell",
  "route": "/",
  "description": "Landing page with concept chain visualization, module cards, and persistent sidebar navigation.",
  "files_created": [
    "src/pages/Landing.tsx",
    "src/components/Sidebar.tsx",
    "src/components/ConceptChain.tsx",
    "src/components/ModuleCard.tsx"
  ],
  "landing_content": {
    "hero": "Title: 'Bitcoin Vault'. Tagline: 'From private key to multisig transaction — every step, live.' 'Start Learning' CTA → /hash",
    "concept_chain": "Horizontal flow diagram: Hash Functions → Keys & Addresses → UTXOs → Blockchain → HD Wallets → Multisig. Each node links to its module. Completed modules shown with checkmark (progress stored in localStorage).",
    "module_cards": "6 cards, one per module. Each shows: icon, title, one-line description, estimated time, prerequisite modules."
  },
  "sidebar": "Fixed left sidebar showing all 6 modules with icons. Current module highlighted. Collapsible on mobile (hamburger). Progress dots per module.",
  "acceptance_criteria": [
    "Landing page renders all 6 module cards",
    "Concept chain is a visually connected flow (SVG or CSS lines between nodes)",
    "Clicking any module card navigates to the correct route",
    "Sidebar collapses correctly on screens < 768px",
    "Module completion progress persists after page refresh (localStorage)",
    "Page transition animations between routes (Framer Motion AnimatePresence)"
  ]
}
```

---

### STEP 11 — PWA Polish, Offline Support & Performance

```json
{
  "step": 11,
  "title": "PWA Polish, Offline Mode & Performance",
  "description": "Finalize PWA config, audit performance, add install prompt, update flow, and offline indicator.",
  "files_modified": [
    "vite.config.ts (finalize Workbox config)",
    "src/components/InstallPrompt.tsx",
    "src/components/UpdateBanner.tsx",
    "src/components/OfflineIndicator.tsx"
  ],
  "workbox_config": {
    "strategy": "GenerateSW",
    "precache": "All JS chunks, CSS, fonts, icons",
    "runtime_cache": "None (no external APIs to cache)",
    "navigation_fallback": "index.html"
  },
  "acceptance_criteria": [
    "Lighthouse PWA score ≥ 90",
    "Lighthouse Performance score ≥ 85",
    "App loads and functions fully with network disabled (Chrome DevTools offline mode)",
    "Install prompt appears in Chrome/Edge after second visit",
    "When a new version is deployed, UpdateBanner appears: 'New version available — reload to update'",
    "OfflineIndicator shows when navigator.onLine is false",
    "All @noble/* crypto libraries are in a separate vendor chunk (code split)",
    "First contentful paint < 1.5s on simulated 4G throttling"
  ]
}
```

---

---

### STEP 13 — Attack Module: ECDSA Nonce Reuse + xpub Leak

```json
{
  "step": 13,
  "title": "Module 7 — Attack Lab: ECDSA Nonce Reuse & xpub Child Key Leak",
  "route": "/attacks",
  "description": "Two primary attack demos running real cryptographic math in-browser. No mocking. Every intermediate value shown and labeled. Step-by-step reveal mode for first-time viewers.",
  "files_created": [
    "src/modules/07-attacks/AttackLab.tsx",
    "src/modules/07-attacks/tabs/NonceReuseAttack.tsx",
    "src/modules/07-attacks/tabs/XpubLeakAttack.tsx",
    "src/modules/07-attacks/tabs/WeakEntropyDemo.tsx",
    "src/modules/07-attacks/tabs/RainbowTableDemo.tsx",
    "src/modules/07-attacks/components/AttackDisclaimer.tsx",
    "src/modules/07-attacks/components/FormulaStep.tsx",
    "src/modules/07-attacks/components/AttackResultBadge.tsx",
    "src/modules/07-attacks/useNonceReuseState.ts",
    "src/modules/07-attacks/useXpubLeakState.ts"
  ],
  "nonce_reuse_behavior": {
    "setup": "Auto-generate a fresh private key + public key on mount. Two editable message inputs. Nonce mode toggle: 'Same nonce k' vs 'Different nonce'.",
    "signing": "'Sign Both Messages' button calls signWithNonce() from attacks.ts. In same-nonce mode both calls receive identical k. In different-nonce mode k is random each time.",
    "signature_display": "Show r, s1, s2 for both sigs. Highlight r1 === r2 with amber badge in same-nonce mode. Show r1 ≠ r2 with gray badge in different-nonce mode.",
    "attack_panel": "Three FormulaStep components revealed in sequence: (1) compute k via (z1-z2)·(s1-s2)⁻¹ mod n, (2) compute privkey via (s1·k - z1)·r⁻¹ mod n, (3) compare recovered privkey to original.",
    "step_by_step_mode": "Toggle hides attack panel steps behind 'Reveal next step' buttons. Each step shows the formula name, the formula, the substituted values, and the result.",
    "different_nonce_mode": "Attack panel shows the formula with a red 'INVALID — r1 ≠ r2, k is unknown' result. Privkey extraction fails. 'Protected ✅' badge shown.",
    "formula_display": "All bigint values displayed as hex (with copy button). Labels: z1 = SHA-256(msg1), z2 = SHA-256(msg2), n = secp256k1 curve order (constant, shown). All intermediate steps shown."
  },
  "xpub_leak_behavior": {
    "setup": "Auto-generate master seed. Derive xpub at m/0 (normal) and m/0' (hardened). Show child privkey at index 5.",
    "attack_panel": "Three FormulaStep components: (1) extract chainCode from xpub, (2) derive parentPriv = childPriv - HMAC(chainCode ‖ pubkey ‖ index) mod n, (3) re-derive all m/0/N siblings.",
    "sibling_list": "Show first 8 sibling addresses with their derived private keys after parent recovery. All values are correct — not spoofed.",
    "hardened_toggle": "Switch derivation to hardened. Attack panel step 2 shows: 'HMAC input now requires parent private key — not derivable from xpub alone. Attack fails.' Green 'Protected ✅' badge.",
    "compare_mode": "'Compare Normal vs Hardened' splits view. Left: compromised. Right: protected. Same seed, side by side."
  },
  "acceptance_criteria": [
    "In same-nonce mode: recovered privkey === original privkey (byte-for-byte match verified in test)",
    "In different-nonce mode: attack panel shows failure, no privkey recovered",
    "Hardened derivation mode: xpub leak attack correctly fails to derive parentPriv",
    "Normal derivation mode: xpub leak correctly recovers parentPriv and all siblings match known derivation",
    "All formula values are correct bigints (verify against @noble/curves manual calculations)",
    "FormulaStep component shows: formula name → symbolic formula → substituted hex values → result",
    "Step-by-step mode hides each step behind a 'Reveal' button and does not skip ahead",
    "AttackDisclaimer banner is always visible, cannot be collapsed or dismissed",
    "Regenerate button produces a fresh key and resets all attack state",
    "Module renders correctly on mobile (formulas wrap, hex values truncate with expand option)",
    "Theory panel covers: nonce reuse history (PS3, Android), ECDSA algebraic structure, why k must be random per signature, BIP32 normal vs hardened derivation math"
  ]
}
```

---

### STEP 14 — Attack Module: Weak Entropy & Rainbow Table

```json
{
  "step": 14,
  "title": "Module 7 — Attack Lab: Weak Entropy & Rainbow Table (secondary tabs)",
  "route": "/attacks (sub-tabs 3 and 4)",
  "description": "Two lighter-weight attack demos. Weak entropy shows how predictable private keys enable instant address sweeping. Rainbow table shows how unsalted hashes are reversed by lookup, and how salting defeats it.",
  "files_created": [
    "src/modules/07-attacks/tabs/WeakEntropyDemo.tsx  (already listed in Step 13 files)",
    "src/modules/07-attacks/tabs/RainbowTableDemo.tsx (already listed in Step 13 files)",
    "src/modules/07-attacks/data/brainWalletHallOfShame.ts",
    "src/modules/07-attacks/data/rainbowTable.ts"
  ],
  "weak_entropy_behavior": {
    "phrase_mode": "Text input → SHA-256 → private key → address. Live update as user types.",
    "rng_comparison": "'Cryptographic RNG' button generates a fresh key via window.crypto.getRandomValues. Shows entropy source label and '~2²⁵⁶ possible keys' counter.",
    "hall_of_shame": "Hardcoded list of ~20 historically swept brain wallet passphrases (public info, sourced from public blockchain analysis). Each entry shows: passphrase → privkey prefix → address → 'Balance swept ✅'. User's typed phrase is checked against this list in real time — match triggers a red warning banner.",
    "contrast_panel": "Side-by-side: user phrase key (deterministic, guessable) vs cryptographic RNG key (random, unique). Same derivation pipeline, different entropy quality."
  },
  "rainbow_table_behavior": {
    "precomputed_table": "Hardcoded in rainbowTable.ts: 50 common passwords and their SHA-256 hashes.",
    "target_hash_input": "Dropdown of target hashes from the table (representing a 'leaked database'). User selects one and clicks 'Crack'.",
    "crack_animation": "Table scans row by row (fast but visible — 50ms delay per row for effect). Match row highlights. Result shows: 'Cracked: <password> in Xms'.",
    "salt_toggle": "Toggle salting on. The target hash changes (SHA-256(password + salt)). Crack attempt runs again — no match found. Counter shows 'Table entries checked: 50/50. No match — salt defeats precomputed lookup.'",
    "custom_input": "User can type any password and see it hashed (unsalted vs salted), and check if it appears in the table."
  },
  "data_files": {
    "brainWalletHallOfShame.ts": "Array of { passphrase, address, note } objects. Note field gives context (e.g., 'Swept in 2015, 0.1 BTC lost'). All data sourced from public blockchain analysis — no private information.",
    "rainbowTable.ts": "Array of { password, sha256 } for 50 common passwords. All values precomputed and hardcoded — no runtime hashing needed for the table itself."
  },
  "acceptance_criteria": [
    "SHA-256 of any typed phrase matches @noble/hashes output for same input",
    "Hall of shame check runs client-side with zero network requests",
    "Typing a known brain wallet phrase triggers red warning banner within 100ms",
    "Cryptographic RNG key is always different from the phrase-derived key",
    "Rainbow table crack always succeeds for any hash selected from the dropdown",
    "Salt toggle always defeats the rainbow table lookup (no false matches)",
    "Salted hash changes when salt is regenerated (Regenerate Salt button)",
    "All 50 rainbow table entries are correct SHA-256 values (verified in unit test)",
    "AttackDisclaimer banner present and non-dismissible on both sub-tabs",
    "Both sub-tabs render correctly on 375px mobile width"
  ]
}
```

---

### STEP 12 — Testing & Documentation

```json
{
  "step": 12,
  "title": "Test Suite & Documentation",
  "description": "Complete test coverage for all crypto utilities, integration tests for key modules, and user-facing documentation.",
  "files_created": [
    "src/shared/crypto/*.test.ts (one per utility file)",
    "src/modules/**/*.test.tsx (smoke tests per module)",
    "README.md",
    "ARCHITECTURE.md"
  ],
  "test_coverage_targets": {
    "src/shared/crypto/": "100%",
    "src/shared/crypto/attacks.ts": "100% — every formula must have a test vector from a known exploit",
    "src/modules/": "≥ 70% (smoke + key interaction tests)"
  },
  "readme_sections": [
    "What this app teaches",
    "Quick start (npm install + npm run dev)",
    "Module overview",
    "Tech stack rationale",
    "Security note (all keys generated in-browser, never transmitted)",
    "Contributing"
  ],
  "acceptance_criteria": [
    "npm run test passes with 0 failures",
    "Crypto utility coverage report shows 100% line coverage",
    "README accurately describes the app and how to run it",
    "ARCHITECTURE.md documents the module structure and crypto library choices",
    "CI runs test suite on every push (GitHub Actions workflow file included)"
  ]
}
```

---

## 10. Security Notes (Non-Negotiable)

| Risk                              | Mitigation                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Private keys generated in-browser | Clear warning on every screen showing private keys. "This is a learning tool. Never use these keys for real funds."                                                                                                                                          |
| Keys stored in localStorage?      | **Never.** All state is in-memory (React/Zustand). Keys are lost on page refresh by design.                                                                                                                                                                  |
| Weak entropy                      | `generatePrivateKey()` uses `@noble/curves`' internal `getRandomValues` which uses `window.crypto.getRandomValues`                                                                                                                                           |
| Dependency audit                  | All deps from @noble/_ and @scure/_ families — all are audited by independent security researchers                                                                                                                                                           |
| No external requests              | Runtime makes zero network requests. All crypto is offline. Verified by CSP header in prod build.                                                                                                                                                            |
| Attack Lab misuse                 | All attack demos use keys generated fresh in-browser, never transmitted. The module cannot attack real addresses — it has no network access and no mechanism to look up balances. `AttackDisclaimer` is non-dismissible and present on every attack sub-tab. |
| Brain wallet data                 | Hall of shame data is public blockchain analysis (swept addresses, widely published). No private keys, no live lookups, no blockchain API calls.                                                                                                             |

---

## 11. Design System Summary

| Token            | Value                         |
| ---------------- | ----------------------------- |
| Background       | `#08080e`                     |
| Surface          | `#111118`                     |
| Surface raised   | `#1a1a24`                     |
| Accent (primary) | `#f59e0b` (amber-500)         |
| Accent (success) | `#22c55e` (green-500)         |
| Accent (danger)  | `#ef4444` (red-500)           |
| Accent (info)    | `#3b82f6` (blue-500)          |
| Text primary     | `#f4f4f5`                     |
| Text secondary   | `#a1a1aa`                     |
| Font (UI)        | Geist Sans                    |
| Font (hex/mono)  | IBM Plex Mono                 |
| Border radius    | `8px` (cards), `4px` (inputs) |
| Border color     | `rgba(255,255,255,0.08)`      |

---

## 12. Open Questions / Future Phases

- ~~**Phase 5 extension:** Add a "Hack Lab" module simulating nonce reuse → private key extraction~~ ✅ **Added as Module 7, Steps 13–14**
- **Phase 4 extension:** EVM/ERC20 module showing `approve` → `transferFrom` flow and reentrancy demo
- **Network selector:** Toggle between mainnet/testnet address formats across all modules
- **Export feature:** Export a complete "learning transcript" as PDF showing all values generated in a session
- **Collaborative mode:** Share a session state via URL (base64-encoded state in hash fragment, no server needed)
- **Attack Lab extension:** Fee sniping demo (replace-by-fee mempool manipulation) and address reuse privacy attack

---

_End of PRD — v1.1_
