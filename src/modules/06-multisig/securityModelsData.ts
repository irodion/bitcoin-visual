// ── Security Models Data ──
// Six real-world multisig custody models (A–F) based on directed-graph
// representations of who holds keys and who controls spending.

export interface GraphNode {
  id: string;
  label: string;
  type: "user" | "key" | "device" | "oracle" | "custodian" | "arbitrator";
  x: number; // SVG viewBox coordinates (0–400)
  y: number; // SVG viewBox coordinates (0–280)
  vulnerable?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  type: "control" | "cosign" | "policy";
}

export interface SecurityModel {
  id: string;
  title: string;
  subtitle: string;
  quorum: string;
  description: string;
  narrative: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  fixes: string;
  introduces: string;
}

export const SECURITY_MODELS: SecurityModel[] = [
  // ── Model A: Single Key ──
  {
    id: "A",
    title: "Single Key",
    subtitle: "One user, one key",
    quorum: "1-of-1",
    description:
      "The simplest model: one user controls one private key. This is how most people start with Bitcoin — a single wallet on a single device.",
    narrative:
      "This is the starting point. A single private key on a single device is the most common way to hold Bitcoin. It's simple, but fragile.",
    nodes: [
      { id: "user", label: "User", type: "user", x: 120, y: 100 },
      {
        id: "key",
        label: "Private Key",
        type: "key",
        x: 280,
        y: 100,
        vulnerable: true,
      },
    ],
    edges: [{ from: "user", to: "key", label: "controls", type: "control" }],
    fixes: "N/A — this is the baseline model.",
    introduces:
      "Single point of failure. If the key is lost, stolen, or the device is destroyed, the funds are gone forever.",
  },

  // ── Model B: Single-User Multisig ──
  {
    id: "B",
    title: "Single-User Multisig",
    subtitle: "One user, two devices",
    quorum: "2-of-2",
    description:
      "One user splits control across two devices (e.g., phone + hardware wallet). Both keys are needed to spend, so compromising one device isn't enough.",
    narrative:
      "Model A's fatal flaw is the single key. What if we require two keys, held on separate devices? Now no single device compromise can steal funds.",
    nodes: [
      { id: "user", label: "User", type: "user", x: 200, y: 40 },
      { id: "key1", label: "Key (Phone)", type: "device", x: 100, y: 200 },
      {
        id: "key2",
        label: "Key (Hardware)",
        type: "device",
        x: 300,
        y: 200,
      },
    ],
    edges: [
      { from: "user", to: "key1", label: "controls", type: "control" },
      { from: "user", to: "key2", label: "controls", type: "control" },
    ],
    fixes: "Eliminates single-device compromise. An attacker must breach both devices.",
    introduces:
      "Lose either device and you're permanently locked out. No recovery path — 2-of-2 means both keys are always required.",
  },

  // ── Model C: Two-Party Multisig ──
  {
    id: "C",
    title: "Two-Party Multisig",
    subtitle: "Two users, one key each",
    quorum: "2-of-2",
    description:
      "Two separate people each hold one key. Both must agree to spend — useful for joint accounts or business partnerships.",
    narrative:
      "What if the two keys belong to different people? Now spending requires mutual consent. But this creates a new problem: either party can block the other.",
    nodes: [
      { id: "user1", label: "User A", type: "user", x: 100, y: 60 },
      { id: "user2", label: "User B", type: "user", x: 300, y: 60 },
      { id: "key1", label: "Key A", type: "key", x: 100, y: 200 },
      { id: "key2", label: "Key B", type: "key", x: 300, y: 200 },
    ],
    edges: [
      { from: "user1", to: "key1", label: "controls", type: "control" },
      { from: "user2", to: "key2", label: "controls", type: "control" },
    ],
    fixes: "Requires mutual consent — neither party can spend unilaterally.",
    introduces:
      "Availability risk. If one party disappears, becomes unresponsive, or loses their key, funds are permanently frozen.",
  },

  // ── Model D: Trustless Escrow ──
  {
    id: "D",
    title: "Trustless Escrow",
    subtitle: "Buyer, seller, arbitrator",
    quorum: "2-of-3",
    description:
      "Three parties each hold one key. In normal transactions buyer and seller cooperate. If there's a dispute, the arbitrator sides with one party — but can never steal funds alone.",
    narrative:
      "Here's the breakthrough: 2-of-3. By adding a third key holder (arbitrator), we solve the deadlock problem from Model C. The arbitrator can break ties but never spend alone.",
    nodes: [
      { id: "buyer", label: "Buyer", type: "user", x: 80, y: 60 },
      { id: "seller", label: "Seller", type: "user", x: 320, y: 60 },
      {
        id: "arbitrator",
        label: "Arbitrator",
        type: "arbitrator",
        x: 200,
        y: 220,
      },
      { id: "key1", label: "Key 1", type: "key", x: 80, y: 160 },
      { id: "key2", label: "Key 2", type: "key", x: 320, y: 160 },
      { id: "key3", label: "Key 3", type: "key", x: 200, y: 160 },
    ],
    edges: [
      { from: "buyer", to: "key1", label: "controls", type: "control" },
      { from: "seller", to: "key2", label: "controls", type: "control" },
      { from: "arbitrator", to: "key3", label: "resolves", type: "cosign" },
    ],
    fixes:
      "Eliminates deadlock. Dispute resolution without trusting the arbitrator with funds — they can only co-sign, never spend alone.",
    introduces:
      "Arbitrator must be chosen carefully. A colluding arbitrator + one party = stolen funds. Trust is reduced, not eliminated.",
  },

  // ── Model E: User + Policy Oracle ──
  {
    id: "E",
    title: "User + Policy Oracle",
    subtitle: "User holds 2 keys, oracle enforces rules",
    quorum: "2-of-3",
    description:
      "The user controls two keys (e.g., phone + cold backup). A policy oracle holds the third key and co-signs transactions that pass its rules (rate limits, 2FA, whitelists). The user can bypass the oracle using both personal keys.",
    narrative:
      "The most practical model for personal custody. The oracle adds a security layer (spending limits, 2FA) without taking custody. If the oracle goes down, you recover with your two keys.",
    nodes: [
      { id: "user", label: "User", type: "user", x: 120, y: 40 },
      { id: "oracle", label: "Policy Oracle", type: "oracle", x: 320, y: 120 },
      { id: "key1", label: "Key (Phone)", type: "device", x: 60, y: 180 },
      { id: "key2", label: "Key (Backup)", type: "device", x: 200, y: 220 },
      { id: "key3", label: "Key (Oracle)", type: "key", x: 340, y: 220 },
    ],
    edges: [
      { from: "user", to: "key1", label: "controls", type: "control" },
      { from: "user", to: "key2", label: "controls", type: "control" },
      { from: "oracle", to: "key3", label: "enforces policy", type: "policy" },
    ],
    fixes:
      "Adds programmable security (rate limits, 2FA, address whitelists) without giving up custody. User retains full recovery via Key 1 + Key 2.",
    introduces:
      "Oracle is a trusted service — if it's compromised, it could co-sign malicious transactions with a stolen user key. Mitigated by user holding two keys for independent recovery.",
  },

  // ── Model F: Enterprise Custody ──
  {
    id: "F",
    title: "Enterprise Custody",
    subtitle: "User, custodian, and oracle",
    quorum: "2-of-3",
    description:
      "Three separate entities each hold one key: the user, a professional custodian, and a policy oracle. Normal transactions require user + oracle. The custodian provides recovery if the user loses access.",
    narrative:
      "For organizations and high-value holdings, separate the roles further. A custodian handles recovery, the oracle enforces policy, and the user initiates transactions. No single party can act alone.",
    nodes: [
      { id: "user", label: "User", type: "user", x: 60, y: 60 },
      {
        id: "custodian",
        label: "Custodian",
        type: "custodian",
        x: 340,
        y: 60,
      },
      { id: "oracle", label: "Policy Oracle", type: "oracle", x: 200, y: 220 },
      { id: "key1", label: "Key (User)", type: "key", x: 60, y: 170 },
      { id: "key2", label: "Key (Custodian)", type: "key", x: 340, y: 170 },
      { id: "key3", label: "Key (Oracle)", type: "key", x: 200, y: 160 },
    ],
    edges: [
      { from: "user", to: "key1", label: "controls", type: "control" },
      { from: "custodian", to: "key2", label: "safeguards", type: "cosign" },
      { from: "oracle", to: "key3", label: "enforces policy", type: "policy" },
    ],
    fixes:
      "Full separation of concerns: user initiates, oracle governs, custodian recovers. No single entity can steal or block indefinitely.",
    introduces:
      "Complexity and trust in two external parties. Custodian + oracle colluding could theoretically bypass the user — requires strong legal and operational safeguards.",
  },
];
