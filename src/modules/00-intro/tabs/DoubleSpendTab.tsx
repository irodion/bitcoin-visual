import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STEP_VARIANTS,
  SECTION_LABEL,
  BTN_PRIMARY,
  BTN_GHOST,
} from "../../../shared/components/styles.ts";

interface Props {
  onInteract: () => void;
}

const PHASES = [
  {
    title: "Alice has 1 BTC",
    description: "Alice controls a spendable output worth 1 BTC. It's hers to spend — once.",
  },
  {
    title: "Alice tries to spend it twice",
    description:
      "She sends 1 BTC to Bob and simultaneously sends the same 1 BTC to Charlie. Which payment is valid? In a naive digital system, both copies could exist.",
  },
  {
    title: "The network resolves the conflict",
    description:
      "Bitcoin miners include one transaction in a block. The network converges on a single accepted history. The conflicting payment is rejected.",
  },
];

function CoinBox({
  label,
  color,
  strikethrough,
}: {
  label: string;
  color: string;
  strikethrough?: boolean;
}) {
  return (
    <div
      className={`rounded-card border px-5 py-3 text-center ${color} ${strikethrough ? "opacity-50" : ""}`}
    >
      <span
        className={`text-sm font-bold text-text-primary ${strikethrough ? "line-through" : ""}`}
      >
        {label}
      </span>
    </div>
  );
}

function Phase0() {
  return (
    <div className="flex justify-center">
      <CoinBox label="Alice: 1 BTC" color="border-accent/40 bg-accent/5" />
    </div>
  );
}

function Phase1() {
  return (
    <div className="flex flex-col items-center gap-4">
      <CoinBox label="Alice: 1 BTC" color="border-accent/40 bg-accent/5" />
      <div className="flex items-center gap-2">
        <span className="text-text-muted" aria-hidden>
          ↓
        </span>
        <span className="text-xs font-medium text-danger">Sends to both!</span>
        <span className="text-text-muted" aria-hidden>
          ↓
        </span>
      </div>
      <div className="flex gap-4">
        <CoinBox label="→ Bob: 1 BTC" color="border-warning/40 bg-warning/5" />
        <CoinBox label="→ Charlie: 1 BTC" color="border-warning/40 bg-warning/5" />
      </div>
      <p className="text-xs font-medium text-danger/80">
        Two conflicting payments — which one is real?
      </p>
    </div>
  );
}

function Phase2() {
  return (
    <div className="flex flex-col items-center gap-4">
      <CoinBox label="Alice: 1 BTC" color="border-border bg-surface-raised" />
      <span className="text-text-muted" aria-hidden>
        ↓
      </span>
      <div className="flex gap-4">
        <CoinBox label="✓ Bob: 1 BTC" color="border-success/40 bg-success/5" />
        <CoinBox label="✗ Charlie" color="border-danger/40 bg-danger/5" strikethrough />
      </div>
      <p className="text-xs font-medium text-success/80">
        The network agrees: Bob's payment is confirmed. Charlie's conflicting payment is rejected.
      </p>
    </div>
  );
}

const PHASE_VIEWS = [Phase0, Phase1, Phase2];

export function DoubleSpendTab({ onInteract }: Props) {
  const [phase, setPhase] = useState(0);

  const advance = () => {
    if (phase < PHASES.length - 1) {
      setPhase((p) => p + 1);
      onInteract();
    }
  };

  const reset = () => setPhase(0);

  const PhaseView = PHASE_VIEWS[phase];

  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-8"
    >
      <div className="text-center">
        <p className={SECTION_LABEL}>
          Step {phase + 1} of {PHASES.length}
        </p>
        <h3 className="mt-1 text-lg font-bold text-text-primary">{PHASES[phase].title}</h3>
        <p className="mt-2 max-w-md text-sm text-text-secondary">{PHASES[phase].description}</p>
      </div>

      <div className="min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <PhaseView />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        {phase < PHASES.length - 1 ? (
          <button type="button" className={BTN_PRIMARY} onClick={advance}>
            Next Step
          </button>
        ) : (
          <button type="button" className={BTN_GHOST} onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <p className="max-w-lg text-center text-sm font-medium text-text-secondary">
        Bitcoin's breakthrough is coordinated agreement on valid payment history without one central
        decider.
      </p>
    </motion.div>
  );
}
