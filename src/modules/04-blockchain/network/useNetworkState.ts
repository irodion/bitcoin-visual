import { useState, useCallback, useRef, useEffect } from "react";
import {
  GOSSIP_NODES,
  GOSSIP_EDGES,
  COMPACT_BLOCK_TXS,
  ECLIPSE_INITIAL_CONNECTIONS,
  DEFAULT_GOSSIP_SPEED_MS,
  COMPACT_BLOCK_PHASE_DELAY_MS,
  BOOTSTRAP_TICK_MS,
  BOOTSTRAP_TIMER_SECONDS,
  type NetworkNodeDef,
  type NetworkEdgeDef,
  type GossipViewMode,
  type CompactBlockPhase,
  type EclipsePhase,
  type EclipseConnection,
  type BootstrapStage,
} from "./networkConstants.ts";

// ── Gossip Node Runtime State ──

export interface GossipNodeState extends NetworkNodeDef {
  informed: boolean;
  informedAtTick: number | null;
}

// ── Return Type ──

export interface NetworkState {
  // Gossip
  gossipNodes: GossipNodeState[];
  gossipTick: number;
  gossipSpeed: number;
  gossipRunning: boolean;
  gossipViewMode: GossipViewMode;
  gossipMessageCount: number;
  startGossip: (sourceNodeId: string) => void;
  resetGossip: () => void;
  setGossipSpeed: (ms: number) => void;
  setGossipViewMode: (mode: GossipViewMode) => void;

  // Compact Block
  compactBlockPhase: CompactBlockPhase;
  compactBlockSavings: number;
  startCompactBlockDemo: () => void;
  resetCompactBlock: () => void;

  // Eclipse
  eclipsePhase: EclipsePhase;
  eclipseConnections: EclipseConnection[];
  eclipseStep: number;
  advanceEclipse: () => void;
  resetEclipse: () => void;

  // Bootstrap
  bootstrapStage: BootstrapStage | null;
  bootstrapTimer: number;
  bootstrapRunning: boolean;
  bootstrapCompleted: Set<BootstrapStage>;
  startBootstrap: () => void;
  resetBootstrap: () => void;
}

// ── Static Derived Constants ──

const COMPACT_IN_MEMPOOL_COUNT = COMPACT_BLOCK_TXS.filter((tx) => tx.inMempool).length;
const COMPACT_TOTAL_TX_COUNT = COMPACT_BLOCK_TXS.length;
const COMPACT_BLOCK_SAVINGS = Math.round(
  ((COMPACT_TOTAL_TX_COUNT * 32 - COMPACT_TOTAL_TX_COUNT * 6) / (COMPACT_TOTAL_TX_COUNT * 32)) *
    100,
);

const COMPACT_DEMO_PHASES: CompactBlockPhase[] = (() => {
  const phases: CompactBlockPhase[] = [
    "show-block",
    "compress",
    "transmit",
    "reconstruct",
    "request-missing",
    "complete",
  ];
  return COMPACT_IN_MEMPOOL_COUNT === COMPACT_TOTAL_TX_COUNT
    ? phases.filter((p) => p !== "request-missing")
    : phases;
})();

// ── Helpers ──

function buildAdjacencyList(
  edges: readonly NetworkEdgeDef[],
  viewMode: GossipViewMode,
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of GOSSIP_NODES) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    if (viewMode === "outbound-only" && !edge.isOutbound) continue;
    const list = adj.get(edge.from);
    if (list) list.push(edge.to);
    // Gossip is bidirectional for propagation even if connection is one-way
    const reverseList = adj.get(edge.to);
    if (reverseList) reverseList.push(edge.from);
  }
  return adj;
}

function createInitialGossipNodes(): GossipNodeState[] {
  return GOSSIP_NODES.map((n) => ({ ...n, informed: false, informedAtTick: null }));
}

// ── Hook ──

export function useNetworkState(): NetworkState {
  // ── Gossip State ──
  const [gossipNodes, setGossipNodes] = useState<GossipNodeState[]>(createInitialGossipNodes);
  const [gossipTick, setGossipTick] = useState(0);
  const [gossipSpeed, setGossipSpeed] = useState(DEFAULT_GOSSIP_SPEED_MS);
  const [gossipRunning, setGossipRunning] = useState(false);
  const [gossipViewMode, setGossipViewMode] = useState<GossipViewMode>("all");
  const [gossipMessageCount, setGossipMessageCount] = useState(0);

  const gossipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gossipQueueRef = useRef<string[]>([]);
  const gossipAdjRef = useRef<Map<string, string[]>>(new Map());
  const gossipInformedRef = useRef<Set<string>>(new Set());
  const gossipRunningRef = useRef(false);

  const clearGossipInterval = useCallback(() => {
    if (gossipIntervalRef.current !== null) {
      clearInterval(gossipIntervalRef.current);
      gossipIntervalRef.current = null;
    }
  }, []);

  const startGossip = useCallback(
    (sourceNodeId: string) => {
      clearGossipInterval();

      const adj = buildAdjacencyList(GOSSIP_EDGES, gossipViewMode);
      gossipAdjRef.current = adj;
      gossipInformedRef.current = new Set([sourceNodeId]);
      gossipQueueRef.current = [sourceNodeId];
      gossipRunningRef.current = true;

      setGossipNodes(
        GOSSIP_NODES.map((n) => ({
          ...n,
          informed: n.id === sourceNodeId,
          informedAtTick: n.id === sourceNodeId ? 0 : null,
        })),
      );
      setGossipTick(0);
      setGossipMessageCount(0);
      setGossipRunning(true);

      let tick = 0;

      gossipIntervalRef.current = setInterval(() => {
        if (!gossipRunningRef.current) return;

        const queue = gossipQueueRef.current;
        const informed = gossipInformedRef.current;
        const currentAdj = gossipAdjRef.current;

        if (queue.length === 0) {
          gossipRunningRef.current = false;
          setGossipRunning(false);
          clearGossipInterval();
          return;
        }

        tick += 1;
        const nextQueue: string[] = [];
        let newMessages = 0;

        for (const nodeId of queue) {
          const neighbors = currentAdj.get(nodeId) ?? [];
          for (const neighbor of neighbors) {
            if (!informed.has(neighbor)) {
              informed.add(neighbor);
              nextQueue.push(neighbor);
              newMessages += 1;
            }
          }
        }

        gossipQueueRef.current = nextQueue;
        setGossipTick(tick);
        setGossipMessageCount((prev) => prev + newMessages);

        setGossipNodes((prev) =>
          prev.map((n) =>
            informed.has(n.id) && !n.informed ? { ...n, informed: true, informedAtTick: tick } : n,
          ),
        );

        if (nextQueue.length === 0) {
          gossipRunningRef.current = false;
          setGossipRunning(false);
          clearGossipInterval();
        }
      }, gossipSpeed);
    },
    [gossipViewMode, gossipSpeed, clearGossipInterval],
  );

  const resetGossip = useCallback(() => {
    clearGossipInterval();
    gossipRunningRef.current = false;
    gossipQueueRef.current = [];
    gossipInformedRef.current.clear();
    setGossipNodes(createInitialGossipNodes());
    setGossipTick(0);
    setGossipMessageCount(0);
    setGossipRunning(false);
  }, [clearGossipInterval]);

  // ── Compact Block State ──
  const [compactBlockPhase, setCompactBlockPhase] = useState<CompactBlockPhase>("idle");
  const compactTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearCompactTimeouts = useCallback(() => {
    for (const t of compactTimeoutsRef.current) clearTimeout(t);
    compactTimeoutsRef.current = [];
  }, []);

  const startCompactBlockDemo = useCallback(() => {
    clearCompactTimeouts();
    const delay = COMPACT_BLOCK_PHASE_DELAY_MS;

    setCompactBlockPhase(COMPACT_DEMO_PHASES[0]);

    for (let i = 1; i < COMPACT_DEMO_PHASES.length; i++) {
      const t = setTimeout(() => {
        setCompactBlockPhase(COMPACT_DEMO_PHASES[i]);
      }, delay * i);
      compactTimeoutsRef.current.push(t);
    }
  }, [clearCompactTimeouts]);

  const resetCompactBlock = useCallback(() => {
    clearCompactTimeouts();
    setCompactBlockPhase("idle");
  }, [clearCompactTimeouts]);

  // ── Eclipse Attack State ──
  const [eclipsePhase, setEclipsePhase] = useState<EclipsePhase>("honest");
  const [eclipseConnections, setEclipseConnections] = useState<EclipseConnection[]>(() => [
    ...ECLIPSE_INITIAL_CONNECTIONS,
  ]);
  const [eclipseStep, setEclipseStep] = useState(0);

  const advanceEclipse = useCallback(() => {
    setEclipseStep((prev) => prev + 1);

    if (eclipsePhase === "honest" || eclipsePhase === "replacing") {
      // Replace next honest connection, then check if all are now attacker-controlled
      setEclipseConnections((conns) => {
        const idx = conns.findIndex((c) => !c.isAttacker);
        if (idx === -1) {
          setEclipsePhase("eclipsed");
          return conns;
        }
        const copy = [...conns];
        copy[idx] = { ...copy[idx], isAttacker: true };
        // Check if this was the last honest connection
        const remainingHonest = copy.filter((c) => !c.isAttacker).length;
        setEclipsePhase(remainingHonest === 0 ? "eclipsed" : "replacing");
        return copy;
      });
    } else if (eclipsePhase === "eclipsed") {
      setEclipsePhase("fake-chain");
    } else if (eclipsePhase === "fake-chain") {
      setEclipsePhase("defense");
    }
  }, [eclipsePhase]);

  const resetEclipse = useCallback(() => {
    setEclipsePhase("honest");
    setEclipseConnections([...ECLIPSE_INITIAL_CONNECTIONS]);
    setEclipseStep(0);
  }, []);

  // ── Bootstrap State ──
  const [bootstrapStage, setBootstrapStage] = useState<BootstrapStage | null>(null);
  const [bootstrapTimer, setBootstrapTimer] = useState(0);
  const [bootstrapRunning, setBootstrapRunning] = useState(false);
  const [bootstrapCompleted, setBootstrapCompleted] = useState<Set<BootstrapStage>>(new Set());
  const bootstrapIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bootstrapRunningRef = useRef(false);

  const clearBootstrapInterval = useCallback(() => {
    if (bootstrapIntervalRef.current !== null) {
      clearInterval(bootstrapIntervalRef.current);
      bootstrapIntervalRef.current = null;
    }
  }, []);

  const startBootstrap = useCallback(() => {
    clearBootstrapInterval();
    bootstrapRunningRef.current = true;
    setBootstrapRunning(true);
    setBootstrapStage("peers-dat");
    setBootstrapTimer(0);
    setBootstrapCompleted(new Set());

    let timer = 0;

    bootstrapIntervalRef.current = setInterval(() => {
      if (!bootstrapRunningRef.current) return;

      timer += 1;
      setBootstrapTimer(timer);

      if (timer === BOOTSTRAP_TIMER_SECONDS) {
        // peers.dat timeout — no peers found, move to DNS
        setBootstrapCompleted((prev) => new Set(prev).add("peers-dat"));
        setBootstrapStage("dns-seed");
      } else if (timer === BOOTSTRAP_TIMER_SECONDS + 4) {
        // DNS seeds respond
        setBootstrapCompleted((prev) => new Set(prev).add("dns-seed"));
        setBootstrapStage("hardcoded");
      } else if (timer === BOOTSTRAP_TIMER_SECONDS + 6) {
        setBootstrapCompleted((prev) => new Set(prev).add("hardcoded"));
        setBootstrapStage("irc");
      } else if (timer === BOOTSTRAP_TIMER_SECONDS + 8) {
        setBootstrapCompleted((prev) => new Set(prev).add("irc"));
        bootstrapRunningRef.current = false;
        setBootstrapRunning(false);
        clearBootstrapInterval();
      }
    }, BOOTSTRAP_TICK_MS);
  }, [clearBootstrapInterval]);

  const resetBootstrap = useCallback(() => {
    clearBootstrapInterval();
    bootstrapRunningRef.current = false;
    setBootstrapStage(null);
    setBootstrapTimer(0);
    setBootstrapRunning(false);
    setBootstrapCompleted(new Set());
  }, [clearBootstrapInterval]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      clearGossipInterval();
      clearCompactTimeouts();
      clearBootstrapInterval();
    };
  }, [clearGossipInterval, clearCompactTimeouts, clearBootstrapInterval]);

  return {
    // Gossip
    gossipNodes,
    gossipTick,
    gossipSpeed,
    gossipRunning,
    gossipViewMode,
    gossipMessageCount,
    startGossip,
    resetGossip,
    setGossipSpeed,
    setGossipViewMode,

    // Compact Block
    compactBlockPhase,
    compactBlockSavings: COMPACT_BLOCK_SAVINGS,
    startCompactBlockDemo,
    resetCompactBlock,

    // Eclipse
    eclipsePhase,
    eclipseConnections,
    eclipseStep,
    advanceEclipse,
    resetEclipse,

    // Bootstrap
    bootstrapStage,
    bootstrapTimer,
    bootstrapRunning,
    bootstrapCompleted,
    startBootstrap,
    resetBootstrap,
  };
}
