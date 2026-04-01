export interface ModuleInfo {
  key: string;
  number: number;
  title: string;
  description: string;
  route: string;
  color: string;
  active: boolean;
  estimatedMinutes: number;
  prerequisites: string[];
}

export const MODULES: ModuleInfo[] = [
  {
    key: "hash",
    number: 1,
    title: "Hash Playground",
    description: "SHA-256 and SHA-256d — type anything, watch the fingerprint materialize.",
    route: "/hash",
    color: "#F7931A",
    active: true,
    estimatedMinutes: 10,
    prerequisites: [],
  },
  {
    key: "keys",
    number: 2,
    title: "Keys & Addresses",
    description: "Generate a private key, derive public key, and encode Bitcoin addresses.",
    route: "/keys",
    color: "#36CFC9",
    active: true,
    estimatedMinutes: 15,
    prerequisites: ["hash"],
  },
  {
    key: "utxo",
    number: 3,
    title: "UTXO & Transactions",
    description: "Build and inspect raw Bitcoin transactions, input by input.",
    route: "/utxo",
    color: "#7DD3FC",
    active: true,
    estimatedMinutes: 20,
    prerequisites: ["keys"],
  },
  {
    key: "blockchain",
    number: 4,
    title: "Blockchain & Mining",
    description: "Mine blocks, adjust difficulty, and see how the chain grows.",
    route: "/blockchain",
    color: "#22C55E",
    active: true,
    estimatedMinutes: 20,
    prerequisites: ["utxo"],
  },
  {
    key: "hd-wallet",
    number: 5,
    title: "HD Wallet Tree",
    description: "BIP-32/39 hierarchical deterministic key derivation visualized.",
    route: "/hd-wallet",
    color: "#FBBF24",
    active: true,
    estimatedMinutes: 20,
    prerequisites: ["keys"],
  },
  {
    key: "multisig",
    number: 6,
    title: "Multisig Vault",
    description: "Create 2-of-3 multisig scripts and sign with PSBTs.",
    route: "/multisig",
    color: "#A78BFA",
    active: true,
    estimatedMinutes: 25,
    prerequisites: ["keys", "utxo"],
  },
  {
    key: "attacks",
    number: 7,
    title: "Attack Lab",
    description: "Nonce reuse, xpub leaks, and other real-world crypto pitfalls.",
    route: "/attacks",
    color: "#FF6B6B",
    active: true,
    estimatedMinutes: 15,
    prerequisites: [],
  },
];

/** Modules in the concept chain (excludes Attack Lab which is a standalone lab) */
export const LEARNING_PATH: string[] = [
  "hash",
  "keys",
  "utxo",
  "blockchain",
  "hd-wallet",
  "multisig",
];
