import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STEP_VARIANTS, BTN_PRIMARY, BTN_GHOST } from "../../../shared/components/styles.ts";

interface Props {
  onInteract: () => void;
}

const STAGES = [
  {
    label: "Wallet",
    description:
      "A wallet creates a new payment and prepares it for the network. How wallets prove ownership is covered in later modules — for now, just know the payment is ready to send.",
  },
  {
    label: "Broadcast",
    description:
      "The payment is sent to nearby nodes. Each node checks it against shared rules — no double spends, no invalid data — and relays it to peers.",
  },
  {
    label: "Mining",
    description:
      "Miners collect valid transactions from the waiting area (mempool) and compete to find a valid block by searching for a proof-of-work solution.",
  },
  {
    label: "Block Found",
    description:
      "A miner finds a valid proof of work and announces the new block to the network. The block contains the transaction along with many others.",
  },
  {
    label: "Chain Grows",
    description:
      "Nodes verify the block, accept it, and extend their copy of the blockchain. The transaction is now part of the shared history — confirmed and very hard to reverse.",
  },
];

function StagePill({ label, state }: { label: string; state: "completed" | "active" | "future" }) {
  const colors =
    state === "completed"
      ? "border-success/40 bg-success/10 text-success"
      : state === "active"
        ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_rgba(247,147,26,0.15)]"
        : "border-border bg-surface-raised text-text-muted";

  return (
    <div className={`rounded-pill border px-3 py-1.5 text-xs font-bold ${colors}`}>{label}</div>
  );
}

function StageArrow({ completed }: { completed: boolean }) {
  return (
    <span className={`text-sm ${completed ? "text-success/60" : "text-text-muted/30"}`} aria-hidden>
      →
    </span>
  );
}

export function NetworkFlowTab({ onInteract }: Props) {
  const [activeStage, setActiveStage] = useState(0);

  const advance = () => {
    if (activeStage < STAGES.length - 1) {
      setActiveStage((s) => s + 1);
      onInteract();
    }
  };

  const reset = () => setActiveStage(0);

  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-8"
    >
      {/* Pipeline */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {STAGES.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-2">
            <StagePill
              label={stage.label}
              state={i < activeStage ? "completed" : i === activeStage ? "active" : "future"}
            />
            {i < STAGES.length - 1 && <StageArrow completed={i < activeStage} />}
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="min-h-[80px] max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeStage}
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-sm text-text-secondary"
          >
            {STAGES[activeStage].description}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {activeStage < STAGES.length - 1 ? (
          <button type="button" className={BTN_PRIMARY} onClick={advance}>
            Next Stage
          </button>
        ) : (
          <button type="button" className={BTN_GHOST} onClick={reset}>
            Restart
          </button>
        )}
      </div>

      <p className="max-w-lg text-center text-sm font-medium text-text-secondary">
        Bitcoin is software, a rule set, and a network of independently verifying computers.
      </p>
    </motion.div>
  );
}
