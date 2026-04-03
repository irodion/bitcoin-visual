import { useMemo } from "react";
import { motion } from "framer-motion";
import { BTN_GHOST, STEP_VARIANTS } from "../../../shared/components/styles.ts";
import { PillToggle } from "../../../shared/components/PillToggle.tsx";
import { NetworkNode } from "./NetworkNode.tsx";
import { NetworkEdge } from "./NetworkEdge.tsx";
import type { GossipNodeState } from "./useNetworkState.ts";
import {
  MIN_GOSSIP_SPEED_MS,
  MAX_GOSSIP_SPEED_MS,
  GOSSIP_SPEED_STEP_MS,
  type NetworkEdgeDef,
  type GossipViewMode,
} from "./networkConstants.ts";

const VIEW_BOX_W = 600;
const VIEW_BOX_H = 400;

const VIEW_OPTIONS = [
  { key: "all" as const, label: "All Connections" },
  { key: "outbound-only" as const, label: "Outbound Only" },
] as const;

// Hop-distance opacity: source is full, further hops fade slightly
function hopOpacity(hopDistance: number): number {
  if (hopDistance === 0) return 1;
  return Math.max(0.5, 1 - hopDistance * 0.1);
}

interface GossipSimulatorProps {
  nodes: GossipNodeState[];
  edges: readonly NetworkEdgeDef[];
  tick: number;
  speed: number;
  running: boolean;
  viewMode: GossipViewMode;
  messageCount: number;
  onStartGossip: (nodeId: string) => void;
  onReset: () => void;
  onSpeedChange: (ms: number) => void;
  onViewModeChange: (mode: GossipViewMode) => void;
}

export function GossipSimulator({
  nodes,
  edges,
  tick,
  speed,
  running,
  viewMode,
  messageCount,
  onStartGossip,
  onReset,
  onSpeedChange,
  onViewModeChange,
}: GossipSimulatorProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, GossipNodeState>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  const informedSet = useMemo(
    () => new Set(nodes.filter((n) => n.informed).map((n) => n.id)),
    [nodes],
  );
  const hasStarted = informedSet.size > 0;

  const visibleEdges = useMemo(
    () => (viewMode === "outbound-only" ? edges.filter((e) => e.isOutbound) : edges),
    [edges, viewMode],
  );

  return (
    <motion.section
      variants={STEP_VARIANTS}
      className="space-y-4 rounded-card border border-border bg-surface-raised p-5"
      aria-labelledby="gossip-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="gossip-heading" className="text-lg font-bold text-text-primary">
            1 · Gossip Propagation
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Click any node to broadcast a message and watch it spread hop-by-hop.
          </p>
        </div>
        <PillToggle<GossipViewMode>
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
          label="Connection view mode"
        />
      </div>

      <div className="relative overflow-hidden rounded-inner border border-border bg-bg">
        <svg
          width="100%"
          viewBox={`0 0 ${VIEW_BOX_W} ${VIEW_BOX_H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Network gossip propagation graph"
          role="img"
        >
          <defs>
            <filter id="gossip-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          </defs>

          {visibleEdges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const bothInformed = informedSet.has(edge.from) && informedSet.has(edge.to);

            // Show animated packet only when a message is being delivered right now:
            // one end was just informed this tick, the other was informed earlier
            const isDelivering =
              bothInformed &&
              running &&
              ((fromNode.informedAtTick !== null &&
                toNode.informedAtTick === tick &&
                fromNode.informedAtTick < tick) ||
                (toNode.informedAtTick !== null &&
                  fromNode.informedAtTick === tick &&
                  toNode.informedAtTick < tick));

            return (
              <NetworkEdge
                key={`${edge.from}-${edge.to}`}
                x1={fromNode.x * VIEW_BOX_W}
                y1={fromNode.y * VIEW_BOX_H}
                x2={toNode.x * VIEW_BOX_W}
                y2={toNode.y * VIEW_BOX_H}
                active={bothInformed}
                type={edge.isOutbound ? "outbound" : "inbound"}
                animated={isDelivering}
              />
            );
          })}

          {nodes.map((node) => {
            const isSource = node.informedAtTick === 0 && node.informed;
            const hopDistance = node.informedAtTick ?? 0;

            return (
              <NetworkNode
                key={node.id}
                id={node.id}
                label={node.label}
                cx={node.x * VIEW_BOX_W}
                cy={node.y * VIEW_BOX_H}
                state={isSource ? "source" : node.informed ? "informed" : "uninformed"}
                colorOverride={
                  isSource ? "var(--color-teal)" : node.informed ? "var(--color-accent)" : undefined
                }
                opacityOverride={node.informed ? hopOpacity(hopDistance) : undefined}
                onClick={running ? undefined : () => onStartGossip(node.id)}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Speed
            <input
              type="range"
              min={MIN_GOSSIP_SPEED_MS}
              max={MAX_GOSSIP_SPEED_MS}
              step={GOSSIP_SPEED_STEP_MS}
              value={MAX_GOSSIP_SPEED_MS + MIN_GOSSIP_SPEED_MS - speed}
              onChange={(e) =>
                onSpeedChange(MAX_GOSSIP_SPEED_MS + MIN_GOSSIP_SPEED_MS - Number(e.target.value))
              }
              className="w-24 accent-accent"
              disabled={running}
            />
            <span className="w-12 font-mono text-xs">{speed}ms</span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          {hasStarted && (
            <div className="flex gap-4 font-mono text-xs text-text-secondary">
              <span>Hops: {tick}</span>
              <span>Messages: {messageCount}</span>
              <span>
                Reached: {informedSet.size}/{nodes.length}
              </span>
            </div>
          )}
          <button type="button" onClick={onReset} className={BTN_GHOST} disabled={!hasStarted}>
            Reset
          </button>
        </div>
      </div>

      {/* Legend — shows what the colors mean after propagation starts */}
      {hasStarted && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-teal" />
            Source (you)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-accent" />
            Hop 1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-accent opacity-70" />
            Hop 2+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-text-muted opacity-30" />
            Not yet reached
          </span>
        </div>
      )}

      <div className="rounded-inner border border-accent/20 bg-accent/5 px-4 py-3">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-accent">Key insight:</span> A Bitcoin node makes only{" "}
          <strong className="text-text-primary">8 outbound</strong> connections but accepts up to
          125 inbound. Security depends on those 8 — even if all 125 inbound peers are malicious,
          one honest outbound connection is enough. Toggle "Outbound Only" to see the
          security-critical topology.
        </p>
      </div>
    </motion.section>
  );
}
