// ── Types ──

export interface NetworkNodeDef {
  id: string;
  label: string;
  /** 0–1 ratio within SVG viewBox */
  x: number;
  /** 0–1 ratio within SVG viewBox */
  y: number;
}

export interface NetworkEdgeDef {
  from: string;
  to: string;
  /** true = outbound connection from `from` node */
  isOutbound: boolean;
}

export type NodeState = "uninformed" | "informed" | "source" | "honest" | "attacker" | "victim";

export type GossipViewMode = "outbound-only" | "all";

export type CompactBlockPhase =
  | "idle"
  | "show-block"
  | "compress"
  | "transmit"
  | "reconstruct"
  | "request-missing"
  | "complete";

export type EclipsePhase = "honest" | "replacing" | "eclipsed" | "fake-chain" | "defense";

export type BootstrapStage = "peers-dat" | "dns-seed" | "hardcoded" | "irc";

export interface BootstrapStageDef {
  key: BootstrapStage;
  label: string;
  description: string;
  detail: string;
  historical?: boolean;
}

export interface CompactBlockTx {
  fullTxid: string;
  shortId: string;
  inMempool: boolean;
}

export interface EclipseConnection {
  peerId: string;
  label: string;
  isAttacker: boolean;
  /** Angle in radians for semicircle positioning */
  angle: number;
}

// ── Gossip Network Nodes ──
// 18 nodes: 12 outer ring + 6 interior

export const GOSSIP_NODES: readonly NetworkNodeDef[] = [
  // Outer ring (roughly circular)
  { id: "n0", label: "A", x: 0.5, y: 0.05 },
  { id: "n1", label: "B", x: 0.73, y: 0.1 },
  { id: "n2", label: "C", x: 0.9, y: 0.25 },
  { id: "n3", label: "D", x: 0.95, y: 0.48 },
  { id: "n4", label: "E", x: 0.88, y: 0.72 },
  { id: "n5", label: "F", x: 0.72, y: 0.88 },
  { id: "n6", label: "G", x: 0.5, y: 0.95 },
  { id: "n7", label: "H", x: 0.28, y: 0.88 },
  { id: "n8", label: "I", x: 0.12, y: 0.72 },
  { id: "n9", label: "J", x: 0.05, y: 0.48 },
  { id: "n10", label: "K", x: 0.1, y: 0.25 },
  { id: "n11", label: "L", x: 0.27, y: 0.1 },
  // Interior nodes
  { id: "n12", label: "M", x: 0.38, y: 0.32 },
  { id: "n13", label: "N", x: 0.62, y: 0.32 },
  { id: "n14", label: "O", x: 0.72, y: 0.55 },
  { id: "n15", label: "P", x: 0.55, y: 0.7 },
  { id: "n16", label: "Q", x: 0.35, y: 0.65 },
  { id: "n17", label: "R", x: 0.3, y: 0.45 },
];

// ── Gossip Network Edges ──
// Each node has ~3 outbound connections, plus some inbound-only links

export const GOSSIP_EDGES: readonly NetworkEdgeDef[] = [
  // Outbound connections (security-critical)
  { from: "n0", to: "n1", isOutbound: true },
  { from: "n0", to: "n11", isOutbound: true },
  { from: "n0", to: "n13", isOutbound: true },
  { from: "n1", to: "n2", isOutbound: true },
  { from: "n1", to: "n13", isOutbound: true },
  { from: "n2", to: "n3", isOutbound: true },
  { from: "n2", to: "n14", isOutbound: true },
  { from: "n3", to: "n4", isOutbound: true },
  { from: "n3", to: "n14", isOutbound: true },
  { from: "n4", to: "n5", isOutbound: true },
  { from: "n4", to: "n15", isOutbound: true },
  { from: "n5", to: "n6", isOutbound: true },
  { from: "n5", to: "n15", isOutbound: true },
  { from: "n6", to: "n7", isOutbound: true },
  { from: "n6", to: "n16", isOutbound: true },
  { from: "n7", to: "n8", isOutbound: true },
  { from: "n7", to: "n16", isOutbound: true },
  { from: "n8", to: "n9", isOutbound: true },
  { from: "n8", to: "n17", isOutbound: true },
  { from: "n9", to: "n10", isOutbound: true },
  { from: "n9", to: "n17", isOutbound: true },
  { from: "n10", to: "n11", isOutbound: true },
  { from: "n10", to: "n12", isOutbound: true },
  { from: "n11", to: "n12", isOutbound: true },
  { from: "n12", to: "n13", isOutbound: true },
  { from: "n12", to: "n17", isOutbound: true },
  { from: "n13", to: "n14", isOutbound: true },
  { from: "n14", to: "n15", isOutbound: true },
  { from: "n15", to: "n16", isOutbound: true },
  { from: "n16", to: "n17", isOutbound: true },
  // Inbound-only connections (don't affect security)
  { from: "n3", to: "n0", isOutbound: false },
  { from: "n5", to: "n1", isOutbound: false },
  { from: "n7", to: "n0", isOutbound: false },
  { from: "n14", to: "n0", isOutbound: false },
  { from: "n15", to: "n13", isOutbound: false },
  { from: "n16", to: "n12", isOutbound: false },
  { from: "n17", to: "n14", isOutbound: false },
  { from: "n6", to: "n3", isOutbound: false },
  { from: "n9", to: "n6", isOutbound: false },
];

// ── Compact Block Mock Data ──

export const COMPACT_BLOCK_TXS: readonly CompactBlockTx[] = [
  {
    fullTxid: "a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01",
    shortId: "a1b2c3d4e5f6",
    inMempool: true,
  },
  {
    fullTxid: "b2c3d4e5f6a1890123456789bcdef0123456789abcdef0123456789abcdef02",
    shortId: "b2c3d4e5f6a1",
    inMempool: true,
  },
  {
    fullTxid: "c3d4e5f6a1b2901234567890cdef01234567890abcdef0123456789abcdef03",
    shortId: "c3d4e5f6a1b2",
    inMempool: true,
  },
  {
    fullTxid: "d4e5f6a1b2c3012345678901def012345678901abcdef0123456789abcdef04",
    shortId: "d4e5f6a1b2c3",
    inMempool: true,
  },
  {
    fullTxid: "e5f6a1b2c3d4123456789012ef0123456789012abcdef0123456789abcdef05",
    shortId: "e5f6a1b2c3d4",
    inMempool: true,
  },
  {
    fullTxid: "f6a1b2c3d4e5234567890123f01234567890123abcdef0123456789abcdef06",
    shortId: "f6a1b2c3d4e5",
    inMempool: true,
  },
  {
    fullTxid: "0123456789ab345678901234012345678901234abcdef0123456789abcdef07",
    shortId: "0123456789ab",
    inMempool: false,
  },
  {
    fullTxid: "1234567890bc456789012345123456789012345abcdef0123456789abcdef08",
    shortId: "1234567890bc",
    inMempool: false,
  },
];

// ── Eclipse Attack Peers ──

const ECLIPSE_ANGLES = Array.from({ length: 8 }, (_, i) => Math.PI * (0.1 + (i * 0.8) / 7));

export const ECLIPSE_INITIAL_CONNECTIONS: readonly EclipseConnection[] = [
  { peerId: "p0", label: "Peer 1", isAttacker: false, angle: ECLIPSE_ANGLES[0] },
  { peerId: "p1", label: "Peer 2", isAttacker: false, angle: ECLIPSE_ANGLES[1] },
  { peerId: "p2", label: "Peer 3", isAttacker: true, angle: ECLIPSE_ANGLES[2] },
  { peerId: "p3", label: "Peer 4", isAttacker: false, angle: ECLIPSE_ANGLES[3] },
  { peerId: "p4", label: "Peer 5", isAttacker: false, angle: ECLIPSE_ANGLES[4] },
  { peerId: "p5", label: "Peer 6", isAttacker: true, angle: ECLIPSE_ANGLES[5] },
  { peerId: "p6", label: "Peer 7", isAttacker: false, angle: ECLIPSE_ANGLES[6] },
  { peerId: "p7", label: "Peer 8", isAttacker: false, angle: ECLIPSE_ANGLES[7] },
];

// ── Bootstrap Stages ──

export const BOOTSTRAP_STAGES: readonly BootstrapStageDef[] = [
  {
    key: "peers-dat",
    label: "peers.dat",
    description: "Check saved peer addresses from last session",
    detail:
      "The node tries its address book first — if any peer responds within 11 seconds, DNS seeds are never queried. This minimizes information leakage about node restarts.",
  },
  {
    key: "dns-seed",
    label: "DNS Seeds",
    description: "Query hardcoded DNS seed domains",
    detail:
      "seed.bitcoin.sipa.be, dnsseed.bluematt.me, dnsseed.bitcoin.dashjr-list-of-hierarchical-deterministic.org, seed.bitcoinstats.com",
  },
  {
    key: "hardcoded",
    label: "Hardcoded IPs",
    description: "Fall back to IP addresses compiled into the binary",
    detail:
      "Addresses of nodes that were active when the software version was built. Even if every DNS seed is compromised, these can still bootstrap the network.",
  },
  {
    key: "irc",
    label: "IRC Discovery",
    description: "Join #bitcoin00–#bitcoin99 channels (removed v0.8.2, 2012)",
    detail:
      "Satoshi's original bootstrap method: join IRC channels and decode nicknames as IP addresses. Removed in 2012 due to centralization risk.",
    historical: true,
  },
];

// ── Gossip Simulation Defaults ──

export const DEFAULT_GOSSIP_SPEED_MS = 500;
export const MIN_GOSSIP_SPEED_MS = 100;
export const MAX_GOSSIP_SPEED_MS = 2000;
export const GOSSIP_SPEED_STEP_MS = 100;

// ── Compact Block Timing ──

export const COMPACT_BLOCK_PHASE_DELAY_MS = 1200;

// ── Bootstrap Timer ──

export const BOOTSTRAP_TIMER_SECONDS = 11;
export const BOOTSTRAP_TICK_MS = 300;
