import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PillToggle } from "../../../shared/components/index.ts";
import { STEP_VARIANTS } from "../../../shared/components/styles.ts";

type LedgerMode = "centralized" | "bitcoin";

const MODE_OPTIONS = [
  { key: "centralized" as const, label: "Central Operator" },
  { key: "bitcoin" as const, label: "Bitcoin Network" },
];

interface Props {
  onInteract: () => void;
}

function ActorBox({ label, sublabel, color }: { label: string; sublabel?: string; color: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-card border px-5 py-4 ${color}`}>
      <span className="text-sm font-bold text-text-primary">{label}</span>
      {sublabel && <span className="text-[11px] text-text-secondary">{sublabel}</span>}
    </div>
  );
}

function Arrow() {
  return (
    <span className="text-lg text-text-muted" aria-hidden>
      →
    </span>
  );
}

function CentralizedView() {
  return (
    <motion.div
      key="centralized"
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex flex-col items-center gap-6"
    >
      <div className="flex items-center gap-4">
        <ActorBox label="Alice" color="border-border bg-surface-raised" />
        <Arrow />
        <ActorBox
          label="Bank"
          sublabel="Controls the ledger"
          color="border-danger/40 bg-danger/5"
        />
        <Arrow />
        <ActorBox label="Bob" color="border-border bg-surface-raised" />
      </div>

      <div className="max-w-md space-y-2 text-center">
        <p className="text-sm text-text-secondary">
          Every payment flows through a single institution. The bank decides who can participate,
          which transfers are valid, and maintains the only copy of the ledger.
        </p>
        <p className="text-xs font-medium text-danger/80">
          Single point of failure · Censorship risk · Requires trust
        </p>
      </div>
    </motion.div>
  );
}

function BitcoinView() {
  return (
    <motion.div
      key="bitcoin"
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex flex-col items-center gap-6"
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <ActorBox label="Alice" color="border-teal/40 bg-teal/5" />
        <ActorBox label="Node" color="border-teal/40 bg-teal/5" />
        <ActorBox label="Bob" color="border-teal/40 bg-teal/5" />
        <ActorBox label="Node" color="border-teal/40 bg-teal/5" />
        <ActorBox label="Node" color="border-teal/40 bg-teal/5" />
      </div>

      <div className="max-w-md space-y-2 text-center">
        <p className="text-sm text-text-secondary">
          No single operator. Every node independently verifies transactions against the same rules
          and maintains its own copy of the shared history.
        </p>
        <p className="text-xs font-medium text-teal/80">
          No single authority · Everyone verifies · Shared rules
        </p>
      </div>
    </motion.div>
  );
}

export function CentralLedgerTab({ onInteract }: Props) {
  const [mode, setMode] = useState<LedgerMode>("centralized");

  const handleChange = (key: LedgerMode) => {
    setMode(key);
    onInteract();
  };

  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-8"
    >
      <PillToggle options={MODE_OPTIONS} value={mode} onChange={handleChange} label="Ledger type" />

      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          {mode === "centralized" ? <CentralizedView /> : <BitcoinView />}
        </AnimatePresence>
      </div>

      <p className="max-w-lg text-center text-sm font-medium text-text-secondary">
        {mode === "centralized"
          ? "Traditional digital money works, but only because someone is in charge of the ledger."
          : "Bitcoin replaces one authoritative updater with many verifiers following the same rules."}
      </p>
    </motion.div>
  );
}
