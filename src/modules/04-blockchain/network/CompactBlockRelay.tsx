import { motion, AnimatePresence } from "framer-motion";
import { BTN_PRIMARY, BTN_GHOST, STEP_VARIANTS } from "../../../shared/components/styles.ts";
import type { CompactBlockPhase, CompactBlockTx } from "./networkConstants.ts";

interface CompactBlockRelayProps {
  txs: readonly CompactBlockTx[];
  phase: CompactBlockPhase;
  savings: number;
  onStart: () => void;
  onReset: () => void;
}

const PHASE_ORDER: CompactBlockPhase[] = [
  "idle",
  "show-block",
  "compress",
  "transmit",
  "reconstruct",
  "request-missing",
  "complete",
];

function phaseAtLeast(current: CompactBlockPhase, target: CompactBlockPhase): boolean {
  return PHASE_ORDER.indexOf(current) >= PHASE_ORDER.indexOf(target);
}

function TxRow({
  tx,
  phase,
  side,
}: {
  tx: CompactBlockTx;
  phase: CompactBlockPhase;
  side: "sender" | "receiver";
}) {
  const showShortId = side === "sender" && phaseAtLeast(phase, "compress");
  const showReceiver = side === "receiver" && phaseAtLeast(phase, "reconstruct");
  const isMissing = !tx.inMempool;
  const resolved = phaseAtLeast(phase, "request-missing") || tx.inMempool;

  if (side === "receiver" && !phaseAtLeast(phase, "transmit")) return null;

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: side === "sender" ? -8 : 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span
        className={`font-mono text-xs ${
          showShortId ? "text-accent" : "text-text-secondary"
        } transition-colors`}
      >
        {showShortId ? tx.shortId : tx.fullTxid.slice(0, 16) + "…"}
      </span>
      {side === "sender" && showShortId && <span className="text-xs text-text-muted">6 B</span>}
      {showReceiver && (
        <span className="text-xs">
          {isMissing && !phaseAtLeast(phase, "request-missing") ? (
            <span className="text-danger">✗ missing</span>
          ) : resolved ? (
            <span className="text-success">✓</span>
          ) : null}
        </span>
      )}
    </motion.div>
  );
}

export function CompactBlockRelay({
  txs,
  phase,
  savings,
  onStart,
  onReset,
}: CompactBlockRelayProps) {
  const isActive = phase !== "idle";
  const missingCount = txs.filter((t) => !t.inMempool).length;

  return (
    <motion.section
      variants={STEP_VARIANTS}
      className="space-y-4 rounded-card border border-border bg-surface-raised p-5"
      aria-labelledby="compact-heading"
    >
      <div>
        <h3 id="compact-heading" className="text-lg font-bold text-text-primary">
          2 · Compact Block Relay
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          32-byte TXIDs replaced by 6-byte short IDs — ~81% smaller per transaction, because every
          node already has the data in its mempool.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 rounded-inner border border-border bg-bg p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-teal" />
            <span className="text-sm font-semibold text-text-primary">Sender (Miner)</span>
          </div>
          {phaseAtLeast(phase, "show-block") && (
            <div className="space-y-1">
              <p className="text-xs text-text-muted">
                {phaseAtLeast(phase, "compress")
                  ? "Short IDs (6 bytes per TXID)"
                  : "Full TXIDs (32 bytes each)"}
              </p>
              {txs.map((tx) => (
                <TxRow key={tx.fullTxid} tx={tx} phase={phase} side="sender" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-inner border border-border bg-bg p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-sm font-semibold text-text-primary">Receiver (Full Node)</span>
          </div>
          {phaseAtLeast(phase, "transmit") && (
            <div className="space-y-1">
              <p className="text-xs text-text-muted">Mempool reconstruction</p>
              {txs.map((tx) => (
                <TxRow key={tx.fullTxid} tx={tx} phase={phase} side="receiver" />
              ))}
            </div>
          )}
          {!phaseAtLeast(phase, "transmit") && phaseAtLeast(phase, "show-block") && (
            <p className="py-8 text-center text-xs text-text-muted">Waiting for block data…</p>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phaseAtLeast(phase, "transmit") && (
          <motion.div
            key="transfer-info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap items-center justify-center gap-4 text-xs"
          >
            <span className="rounded-pill bg-accent/10 px-3 py-1 font-semibold text-accent">
              {txs.length} TXIDs × 6 B = {txs.length * 6} B (vs {txs.length} × 32 B ={" "}
              {txs.length * 32} B full)
            </span>
            {phaseAtLeast(phase, "request-missing") && missingCount > 0 && (
              <span className="rounded-pill bg-danger/10 px-3 py-1 text-danger">
                {missingCount} tx missing → getblocktxn round-trip
              </span>
            )}
            {phaseAtLeast(phase, "complete") && (
              <span className="rounded-pill bg-success/10 px-3 py-1 font-bold text-success">
                ~{savings}% bandwidth saved
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          className={BTN_PRIMARY}
          disabled={isActive && phase !== "complete"}
        >
          {phase === "complete" ? "Replay" : "Start Demo"}
        </button>
        {isActive && (
          <button type="button" onClick={onReset} className={BTN_GHOST}>
            Reset
          </button>
        )}
      </div>

      <div className="rounded-inner border border-info/20 bg-info/5 px-4 py-3">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-info">BIP 152:</span> Since every node already has
          most transactions in its mempool, compact blocks replace full 32-byte TXIDs with 6-byte
          short hashes. The receiver reconstructs the block locally. In practice, this works without
          requesting any missing transactions ~90% of the time.
        </p>
      </div>
    </motion.section>
  );
}
