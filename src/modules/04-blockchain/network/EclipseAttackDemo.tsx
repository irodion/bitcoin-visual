import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { BTN_PRIMARY, BTN_GHOST, STEP_VARIANTS } from "../../../shared/components/styles.ts";
import type { EclipsePhase, EclipseConnection } from "./networkConstants.ts";

interface EclipseAttackDemoProps {
  phase: EclipsePhase;
  connections: EclipseConnection[];
  step: number;
  onAdvance: () => void;
  onReset: () => void;
}

const VICTIM_CX = 200;
const VICTIM_CY = 160;
const PEER_RADIUS = 120;

const PHASE_LABELS: Record<EclipsePhase, string> = {
  honest: "Normal operation — 6 honest, 2 attacker peers",
  replacing: "Attacker exploiting restarts to replace connections…",
  eclipsed: "All 8 outbound connections controlled by attacker!",
  "fake-chain": "Victim sees a shorter, attacker-controlled chain",
  defense: "Anchor connections survive restarts — defense restored",
};

function PeerNode({
  connection,
  cx,
  cy,
}: {
  connection: EclipseConnection;
  cx: number;
  cy: number;
}) {
  const color = connection.isAttacker ? "var(--color-danger)" : "var(--color-teal)";

  return (
    <g>
      <motion.line
        x1={VICTIM_CX}
        y1={VICTIM_CY}
        x2={cx}
        y2={cy}
        stroke={color}
        strokeWidth={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={12}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-text-primary)"
        fontSize={8}
        fontWeight={600}
        style={{ pointerEvents: "none" }}
      >
        {connection.label.replace("Peer ", "")}
      </text>
    </g>
  );
}

function ChainComparisonView({ phase }: { phase: EclipsePhase }) {
  if (phase !== "eclipsed" && phase !== "fake-chain" && phase !== "defense") return null;

  const blockStyle = "h-6 rounded border text-center text-[9px] leading-6 font-mono";

  // Progressive story: isolation → divergence → recovery
  const victimBlocks =
    phase === "eclipsed"
      ? [100, 101, 102]
      : phase === "fake-chain"
        ? [100, 101, 102, "A1", "A2"]
        : [100, 101, 102, 103, 104, 105, 106, 107];

  const realBlocks =
    phase === "eclipsed" ? [100, 101, 102] : [100, 101, 102, 103, 104, 105, 106, 107];

  const victimLabel =
    phase === "eclipsed"
      ? "Victim — isolated, chain frozen"
      : phase === "fake-chain"
        ? "Victim — fed attacker blocks (shorter chain)"
        : "Victim — reconnected, synced to longest chain";

  const isRecovered = phase === "defense";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <div
        className={
          isRecovered
            ? "rounded-inner border border-success/30 bg-success/5 p-3"
            : "rounded-inner border border-danger/30 bg-danger/5 p-3"
        }
      >
        <p className={`mb-2 text-xs font-semibold ${isRecovered ? "text-success" : "text-danger"}`}>
          {victimLabel}
        </p>
        <div className="flex items-center gap-1 overflow-x-auto">
          {victimBlocks.map((b) => {
            const isAttackerBlock = typeof b === "string";
            const normalBlockClass = isRecovered
              ? "w-10 border-success/40 text-success"
              : "w-10 border-danger/40 text-danger";
            return (
              <div
                key={b}
                className={`${blockStyle} shrink-0 ${
                  isAttackerBlock
                    ? "w-10 border-danger/60 bg-danger/10 text-danger"
                    : normalBlockClass
                }`}
              >
                {b}
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-inner border border-success/30 bg-success/5 p-3">
        <p className="mb-2 text-xs font-semibold text-success">Real network — keeps growing</p>
        <div className="flex items-center gap-1 overflow-x-auto">
          {realBlocks.map((b) => (
            <div key={b} className={`${blockStyle} w-10 shrink-0 border-success/40 text-success`}>
              {b}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function EclipseAttackDemo({
  phase,
  connections,
  step,
  onAdvance,
  onReset,
}: EclipseAttackDemoProps) {
  const attackerCount = connections.filter((c) => c.isAttacker).length;
  const isTerminal = phase === "defense";

  return (
    <motion.section
      variants={STEP_VARIANTS}
      className="space-y-4 rounded-card border border-border bg-surface-raised p-5"
      aria-labelledby="eclipse-heading"
    >
      <div>
        <h3 id="eclipse-heading" className="text-lg font-bold text-text-primary">
          3 · Eclipse Attack
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          An attacker monopolizes all 8 outbound connections, isolating the victim from the honest
          network.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-inner border border-border bg-bg">
        <svg
          width="100%"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Eclipse attack visualization"
          role="img"
        >
          <motion.circle
            cx={VICTIM_CX}
            cy={VICTIM_CY}
            r={20}
            fill="var(--color-accent)"
            animate={{
              stroke:
                phase === "eclipsed" || phase === "fake-chain"
                  ? "var(--color-danger)"
                  : "var(--color-accent)",
              strokeWidth: phase === "eclipsed" || phase === "fake-chain" ? 3 : 1.5,
            }}
            transition={{ duration: 0.3 }}
          />
          <text
            x={VICTIM_CX}
            y={VICTIM_CY + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-text-primary)"
            fontSize={9}
            fontWeight={700}
            style={{ pointerEvents: "none" }}
          >
            YOU
          </text>

          {connections.map((conn) => {
            const cx = VICTIM_CX + Math.cos(conn.angle) * PEER_RADIUS;
            const cy = VICTIM_CY + Math.sin(conn.angle) * PEER_RADIUS;
            return <PeerNode key={conn.peerId} connection={conn} cx={cx} cy={cy} />;
          })}

          {/* Anchor connections (defense phase) */}
          {phase === "defense" && (
            <>
              {connections
                .filter((c) => c.isAnchor)
                .map((conn, i) => {
                  const cx = VICTIM_CX + Math.cos(conn.angle) * PEER_RADIUS;
                  const cy = VICTIM_CY + Math.sin(conn.angle) * PEER_RADIUS;
                  return (
                    <motion.line
                      key={`anchor-${i}`}
                      x1={VICTIM_CX}
                      y1={VICTIM_CY}
                      x2={cx}
                      y2={cy}
                      stroke="var(--color-teal)"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  );
                })}
            </>
          )}

          <text
            x={VICTIM_CX}
            y={310}
            textAnchor="middle"
            fill="var(--color-text-secondary)"
            fontSize={11}
          >
            Attacker peers: {attackerCount}/8
          </text>
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`text-sm font-medium ${
            phase === "eclipsed" || phase === "fake-chain"
              ? "text-danger"
              : phase === "defense"
                ? "text-teal"
                : "text-text-secondary"
          }`}
        >
          Step {step}: {PHASE_LABELS[phase]}
        </motion.p>
      </AnimatePresence>

      <ChainComparisonView phase={phase} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onAdvance} className={BTN_PRIMARY} disabled={isTerminal}>
          {isTerminal ? "Demo Complete" : "Next Step"}
        </button>
        <button type="button" onClick={onReset} className={BTN_GHOST}>
          Reset
        </button>
        <Link to="/attacks" className="ml-auto text-sm text-accent hover:underline">
          Explore more attacks →
        </Link>
      </div>

      <div className="rounded-inner border border-danger/20 bg-danger/5 px-4 py-3">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-danger">Eclipse attacks</span> need just a few hundred
          IPs to isolate a node. Defenses added across 4+ Bitcoin Core releases: deterministic
          address bucketing (v0.10.1), feeler connections (v0.13.1), test-before-evict (v0.17.0),
          and <strong className="text-teal">anchor connections</strong> (v0.21.0) — saved peers that
          survive restarts.
        </p>
      </div>
    </motion.section>
  );
}
