import { motion } from "framer-motion";
import type { UTXO } from "./constants.ts";

interface UTXOCoinProps {
  utxo: UTXO;
  isSelected: boolean;
  onToggle: () => void;
}

export function UTXOCoin({ utxo, isSelected, onToggle }: UTXOCoinProps) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`UTXO ${utxo.valueBTC} BTC from ${utxo.label}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      animate={{ scale: isSelected ? 1.02 : 1 }}
      transition={{ duration: 0.15 }}
      className={`cursor-pointer rounded-callout border p-4 text-left transition-all ${
        isSelected
          ? "border-accent bg-accent-muted shadow-(--shadow-glow-accent)"
          : "border-border bg-surface-raised hover:border-border-strong"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: `${utxo.color}18`, color: utxo.color }}
          aria-hidden="true"
        >
          {isSelected ? "✓" : "○"}
        </span>
        <span className="font-mono text-lg font-bold text-text-primary">
          {utxo.valueBTC}
          <span className="ml-1 text-xs font-medium text-text-secondary">BTC</span>
        </span>
      </div>
      <div className="text-[11px] text-text-muted">
        <span className="font-medium">{utxo.label}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-text-muted">
        {utxo.txid.slice(0, 12)}&hellip;:{utxo.vout}
      </div>
    </motion.button>
  );
}
