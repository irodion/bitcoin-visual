# Module 0 Design Document: High-Level Introduction to Bitcoin

**Status:** Proposed
**Audience:** New learners before Module 1
**Date:** 2026-04-04
**Inspiration:** [Learn Me A Bitcoin: How Does Bitcoin Work?](https://learnmeabitcoin.com/beginners/how-does-bitcoin-work/)

## 1. Purpose

Module 0 is the on-ramp for the entire application.

Its job is not to teach implementation details yet. Its job is to give the student a strong mental model for:

- why Bitcoin exists
- what problem it is trying to solve
- what the Bitcoin network is
- who the main actors are
- how value moves at a high level
- how to picture ownership using a simple "lockers" analogy

This module should leave the student feeling oriented, curious, and ready for the technical modules that follow.

## 2. Product Goal

After completing Module 0, a student should be able to explain Bitcoin in plain language:

"Bitcoin is a network of computers that keeps a shared history of who can spend which coins, without needing a central bank or payment company to maintain the ledger."

They should also understand that the later modules unpack the machinery behind that statement:

- Module 1 explains hashes
- Module 2 explains keys and addresses
- Module 3 explains UTXOs and transactions
- Module 4 explains blocks, mining, and chain growth

## 3. Learning Objectives

By the end of Module 0, the student should be able to:

1. Describe the trust problem in traditional digital money systems.
2. Explain what Bitcoin removes or reduces the need to trust.
3. Define the Bitcoin network as many computers running the same rules and sharing the same transaction history.
4. Identify the main high-level components:
   - users
   - wallets
   - nodes
   - miners
   - transactions
   - blocks
   - the blockchain
5. Understand that Bitcoin ownership is not "coins in an account" but "the ability to unlock spendable outputs."
6. Use the lockers analogy to picture UTXO-based ownership before learning the real mechanics later.

## 4. Scope

### In Scope

- High-level motivation for Bitcoin
- Centralized system pain points
- Double-spend problem at a conceptual level
- Shared ledger concept
- Peer-to-peer network overview
- Transactions, blocks, and blockchain at a conceptual level
- Wallets and keys at a conceptual level
- Lockers analogy for spendable outputs and unlocking rights
- Clear bridges into later modules

### Out of Scope

- Raw transaction format
- Script details
- Elliptic curve math
- Hash internals
- Mempool policy nuances
- Consensus edge cases
- Fork taxonomy
- Mining economics in depth
- Privacy deep dives

Module 0 should simplify aggressively, but never lie. When simplifications are made, they should be framed as "high-level for now."

## 5. Core Narrative

The module should tell a simple story:

### Part A: Why do we need Bitcoin?

Digital money is usually managed by central institutions. Those institutions:

- maintain the official ledger
- decide who can participate
- approve or reject payments
- can freeze, reverse, censor, or delay transfers
- become trusted intermediaries and points of failure

Bitcoin is introduced as an alternative: a digital money system where the ledger is maintained by a network instead of a single company or state-controlled database.

### Part B: What problem does it solve?

The headline problem is not just "sending money online." We already had that.

The real problem is:

"How do you let strangers agree on digital ownership and payment history without relying on one central operator?"

This should be framed through the double-spend problem:

- digital information is easy to copy
- if digital coins were just files, they could be duplicated
- a payment system needs a way to agree which spends are valid
- Bitcoin solves this with shared rules, shared history, and global verification

### Part C: What is the network?

Bitcoin is a network of computers running Bitcoin software.

Those computers:

- receive and relay transactions
- validate transactions against shared rules
- store or verify the blockchain
- propagate new blocks
- converge on one shared transaction history

This should feel like a living system, not a website and not a company.

### Part D: What are the main components?

Introduce the major actors in friendly language:

- Wallets: help users create and manage keys, addresses, and payments.
- Users: people controlling keys and sending or receiving value.
- Nodes: rule-enforcing computers that verify data and share it across the network.
- Miners: specialized participants that compete to add blocks.
- Transactions: updates that reassign who can spend value next.
- Blocks: batches of transactions plus proof of work.
- Blockchain: the accumulated shared history of accepted blocks.

### Part E: How should students imagine ownership?

Use the lockers analogy:

- The network contains many lockers.
- Each locker holds some bitcoin value.
- Every locker has a lock condition.
- If you can satisfy that lock condition, you can open that locker and create new lockers for someone else.

This is intentionally a pre-UTXO mental model.

Important nuance:

- users do not really "move coins out of an account balance"
- they unlock existing spendable pieces and create new locked pieces

That prepares the student for Module 3 without overwhelming them with transaction structure now.

## 6. Teaching Angle

This module should feel like a guided systems overview, not a history lecture and not a marketing page.

Tone goals:

- calm
- visual
- precise
- non-ideological
- intellectually honest

Avoid:

- "Bitcoin fixes everything"
- price talk
- tribal or political framing
- unexplained slogans like "trustless" or "decentralized" without showing what they mean

Preferred phrasing:

- "reduces the need to trust specific intermediaries"
- "lets participants verify shared rules themselves"
- "replaces central ledger maintenance with network consensus"

## 7. Module Experience

## Route

Suggested new route:

`/intro`

Suggested title:

`Module 0 — Why Bitcoin Exists`

Suggested subtitle:

`A systems-level overview before we dive into hashes, keys, and transactions.`

## 8. Information Architecture

The module should have four sequential sections, each short and interactive.

### Section 1: The Problem With Traditional Digital Money

**Goal:** establish why digital payments usually require trusted intermediaries.

**Content:**

- A simple central-ledger diagram:
  - Alice
  - Bank / payment company
  - Bob
- Show that the middle party updates the ledger and authorizes transfers.
- Highlight the tradeoff:
  - efficient
  - familiar
  - but centralized

**Interactive concept:**

A toggle between:

- "Centralized ledger"
- "Shared network ledger"

When flipped, the visual changes from one hub to many validating peers.

**Takeaway sentence:**

"Traditional digital money works, but only because someone is in charge of the ledger."

### Section 2: The Double-Spend Problem

**Goal:** explain why digital cash is hard.

**Content:**

- Show one user attempting to send the same digital value twice.
- Explain that copied digital data creates ambiguity.
- Frame the challenge:
  - which payment happened first?
  - who decides?

**Interactive concept:**

A simple animation where one payment splits into two conflicting arrows.

Then reveal the Bitcoin answer:

- everyone checks the same rules
- the network converges on one accepted history
- blocks make accepted history hard to rewrite

**Takeaway sentence:**

"Bitcoin’s breakthrough is coordinated agreement on valid payment history without one central decider."

### Section 3: Meet the Bitcoin Network

**Goal:** show Bitcoin as a real distributed system.

**Content:**

- Many nodes connected peer-to-peer
- Transactions relayed across the network
- Miners packaging transactions into blocks
- Nodes verifying and accepting valid blocks

**Interactive concept:**

A high-level animated flow:

1. wallet creates transaction
2. transaction spreads to nodes
3. miner includes it in a block
4. block spreads
5. nodes accept updated history

This must stay conceptual and not yet introduce mempool details beyond "waiting area."

**Takeaway sentence:**

"Bitcoin is software, a rule set, and a network of independently verifying computers."

### Section 4: The Lockers Analogy

**Goal:** plant the right ownership model before Module 3.

**Content:**

Present value as lockers rather than balances:

- A locker can contain value.
- A locker is locked with a rule.
- A wallet holds the secret needed to open certain lockers.
- Spending means opening old lockers and creating new lockers with new locks.

**Visual design:**

- locker cards with labels like `0.20 BTC`, `0.35 BTC`
- lock icons
- arrows showing one opened locker becoming two new lockers:
  - recipient locker
  - change locker

**Important copy:**

"Bitcoin ownership is really control over unlock conditions, not a number stored in a bank account."

**Takeaway sentence:**

"You don’t log into Bitcoin and edit a balance. You prove you can unlock existing value and re-lock it for the next owner."

## 9. Proposed Screen Structure

Single-page module with scroll-based progression inside the standard module shell.

### Left Theory Panel

Short, structured explanations for each section:

- Why Bitcoin?
- What problem does it solve?
- Who runs the network?
- What does ownership mean?

### Main Sandbox / Story Canvas

Changes by section:

- section 1: centralized vs distributed ledger diagram
- section 2: double-spend animation
- section 3: network propagation animation
- section 4: lockers analogy playground

### Bottom Story Footer

Bridge into the rest of the course:

- "Next: Hash Playground"
- "You’re about to learn the fingerprint function that appears everywhere in Bitcoin."

## 10. Detailed Interaction Concepts

### Interaction A: Central Hub vs Shared Network

**UI:** segmented toggle

- `Central Operator`
- `Bitcoin Network`

**Behavior:**

- In central mode, all arrows route through one institution.
- In Bitcoin mode, arrows spread through many peers and settle into a shared history.

**What it teaches:**

- Bitcoin replaces one authoritative updater with many verifiers following the same rules.

### Interaction B: Double-Spend Conflict

**UI:** "Attempt payment" button

**Behavior:**

- One sender creates two conflicting outgoing payments.
- In a naive digital system, both copies exist.
- In the Bitcoin framing, one accepted history wins and the conflict is resolved by network validation plus block inclusion.

**What it teaches:**

- digital scarcity is not automatic
- agreement on valid history is the key problem

### Interaction C: Transaction Journey

**UI:** stepper or autoplay animation

**Stages:**

1. Wallet creates payment
2. Nodes hear about it
3. Miner adds it to a candidate block
4. A block is found
5. Nodes verify and extend the chain

**What it teaches:**

- main actors and flow without implementation overload

### Interaction D: Locker Playground

**UI:** three lockers and one wallet key ring

**Behavior:**

- user clicks a locker their wallet can open
- locker opens visually
- user distributes value into two new lockers
- one locker belongs to recipient
- one locker returns change

**What it teaches:**

- pre-account mental model
- spendable chunks
- change output intuition

## 11. Content Outline

Suggested copy hierarchy:

### Hero

**Headline:** Why does Bitcoin need its own network?

**Body:** Because digital money is easy to copy, and ordinary online payments usually rely on a central ledger owner to decide what counts. Bitcoin is a way for a network to keep that ledger together instead.

### Core explainer cards

**Card 1:** Why not just use banks?
Banks and payment apps work by maintaining the official ledger for everyone. That is convenient, but it concentrates control, censorship power, and operational risk.

**Card 2:** What makes digital cash hard?
If money is purely digital, you need a way to stop the same value from being spent twice. That requires shared agreement on history.

**Card 3:** What is Bitcoin, then?
Bitcoin is a protocol and a network of computers that validate transactions, relay information, and maintain a shared ledger without a central owner.

**Card 4:** What do you actually own?
Not an account entry at a bank. At a high level, you control the keys that let you unlock certain pieces of bitcoin value and lock them again for someone else.

## 12. Main Concepts and Simplifications

This module should deliberately compress some ideas.

### Safe simplifications

- "Wallets help you control bitcoin" before explaining that wallets hold keys, not coins.
- "Miners add blocks" before unpacking proof of work mechanics.
- "The blockchain is shared history" before teaching block structure.

### Nuances to preserve

- Bitcoin is not a company or website.
- Ownership is not account-based.
- Nodes and miners are not the same role, even if one machine can perform both.
- Verification happens across the network, not by trust in one machine.

## 13. Visual Language

The design should look more foundational and less technical than later modules.

### Visual goals

- approachable but not childish
- systems-oriented
- clear motion showing information flow
- orange used selectively for Bitcoin identity, not everywhere

### Suggested motifs

- ledger cards
- network dots and edges
- transaction packets
- locker cabinets with status states:
  - locked
  - unlocked
  - spent
  - recreated

### Motion ideas

- transaction packets ripple through peers
- conflicting payments pulse red
- accepted block settles with a firm snap
- opened locker transforms into newly locked outputs

## 14. Relationship to Existing Modules

Module 0 should set up, not duplicate, later modules.

### Bridges

- to Module 1: "Hashes help Bitcoin fingerprint data and secure block-building."
- to Module 2: "Keys are how wallets prove they can unlock value."
- to Module 3: "The lockers analogy becomes real UTXOs and transaction outputs."
- to Module 4: "The network animation becomes real blocks, mining, and proof of work."

### What Module 0 must not do

- no raw hex
- no formulas
- no secp256k1 diagrams
- no merkle trees
- no detailed fee or script logic

## 15. Success Criteria

This module succeeds if a new learner can answer these questions afterward:

1. Why can’t digital cash just be copied like any other file?
2. Why do normal online payments rely on central institutions?
3. What does the Bitcoin network do collectively?
4. What are nodes, miners, wallets, transactions, and blocks?
5. Why is the lockers analogy closer to Bitcoin than a bank balance analogy?

## 16. Suggested Future Implementation Notes

If this design is implemented in the app, it likely becomes:

- a new first item in the learning path
- a prerequisite-free orientation module
- the narrative entry point on the landing page

Potential naming options:

- `Why Bitcoin Exists`
- `Bitcoin, At A High Level`
- `Introduction to the Bitcoin Network`

Recommended choice:

`Why Bitcoin Exists`

It is clear, beginner-friendly, and naturally leads into the rest of the journey.

## 17. Summary

Module 0 should give students a clean mental map before they encounter the machinery.

If Module 1 onward teaches "how Bitcoin works under the hood," Module 0 should teach:

- why the machine exists
- what it is trying to protect
- who participates in it
- how to picture ownership before learning the exact data structures

The best outcome is that later modules feel like answers to questions already planted here.
