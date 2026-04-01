import { motion, AnimatePresence } from "framer-motion";
import { HexBox } from "../../../shared/components/index.ts";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  SECTION_LABEL,
  CONTAINER_VARIANTS,
  STEP_VARIANTS,
} from "../../../shared/components/styles.ts";
import { FormulaStep } from "../components/FormulaStep.tsx";
import { AttackResultBadge } from "../components/AttackResultBadge.tsx";
import { PillToggle } from "../components/PillToggle.tsx";
import { TxHexInspector } from "../../03-utxo/TxHexInspector.tsx";
import { useTxMalleabilityState } from "../useTxMalleabilityState.ts";
import { SECP256K1_N_HEX } from "../attackUtils.ts";

const TX_MODE_OPTIONS = [
  { key: "legacy" as const, label: "Legacy (P2PKH)" },
  { key: "segwit" as const, label: "SegWit (P2WPKH)" },
];

export function TxMalleabilityAttack({ onAttackRun }: { onAttackRun?: () => void }) {
  const state = useTxMalleabilityState();
  const r = state.result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={BTN_GHOST} onClick={state.regenerate}>
          Regenerate
        </button>
        <PillToggle
          options={TX_MODE_OPTIONS}
          value={state.txMode}
          onChange={state.setTxMode}
          label="Transaction mode"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={state.stepByStep}
            onChange={state.toggleStepByStep}
            className="accent-accent"
          />
          Step-by-step
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HexBox
          value={state.privateKeyHex}
          label="Private Key (secret)"
          variant="danger"
          truncate
        />
        <HexBox value={state.publicKeyHex} label="Public Key" variant="info" truncate />
      </div>

      <button
        type="button"
        className={`${BTN_PRIMARY} mx-auto block`}
        onClick={() => {
          state.runAttack();
          onAttackRun?.();
        }}
      >
        Malleate Transaction
      </button>

      <AnimatePresence initial={false}>
        {r && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5 overflow-hidden"
          >
            <motion.div
              variants={CONTAINER_VARIANTS}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <FormulaStep
                stepNumber={1}
                title="Parse DER Signature"
                symbolic="DER → (r, s)"
                substitutions={[
                  { label: "r", value: r.originalR },
                  { label: "s (original)", value: r.originalS },
                ]}
                revealed={state.revealedStep >= 0}
                onReveal={state.revealNext}
              />

              <FormulaStep
                stepNumber={2}
                title="Flip S-Value"
                symbolic="s′ = n − s mod n"
                substitutions={[
                  { label: "n (curve order)", value: SECP256K1_N_HEX },
                  { label: "s (original)", value: r.originalS },
                ]}
                result={{
                  label: "s′ (malleated)",
                  value: r.malleatedS,
                  variant: "danger",
                }}
                revealed={state.revealedStep >= 1}
                onReveal={state.revealNext}
              />

              <FormulaStep
                stepNumber={3}
                title="Verify Both Signatures"
                symbolic="R = u₁·G + u₂·Q → check R.x = r"
                revealed={state.revealedStep >= 2}
                onReveal={state.revealNext}
              >
                <p className="mt-2 mb-3 text-xs leading-relaxed text-text-secondary">
                  Negating s negates both u₁ and u₂, producing −R = (x, −y). The x-coordinate is
                  unchanged, so the raw ECDSA check passes. BIP-62 strict mode rejects high-S values
                  by policy — not math — to prevent malleability at the relay layer.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-input border border-border p-3">
                    <div className="text-xs font-semibold text-text-muted">Original Signature</div>
                    <AttackResultBadge
                      variant="protected"
                      label={`Strict (BIP-62): ${r.verifOrigStrict ? "Valid" : "Rejected"}`}
                    />
                    <AttackResultBadge
                      variant="protected"
                      label={`Permissive: ${r.verifOrigPermissive ? "Valid" : "Rejected"}`}
                    />
                  </div>
                  <div className="space-y-2 rounded-input border border-border p-3">
                    <div className="text-xs font-semibold text-text-muted">Malleated Signature</div>
                    <AttackResultBadge
                      variant={r.verifMalleatedStrict ? "protected" : "compromised"}
                      label={`Strict (BIP-62): ${r.verifMalleatedStrict ? "Valid" : "Rejected"}`}
                    />
                    <AttackResultBadge
                      variant="protected"
                      label={`Permissive: ${r.verifMalleatedPermissive ? "Valid" : "Rejected"}`}
                    />
                  </div>
                </div>
              </FormulaStep>

              <FormulaStep
                stepNumber={4}
                title="Compare Transaction IDs"
                symbolic="TxID = SHA-256d(serialize(tx))"
                substitutions={[
                  { label: "Original TxID", value: r.originalTxID },
                  { label: "Malleated TxID", value: r.malleatedTxID },
                ]}
                status={r.txIdChanged ? "failure" : "success"}
                revealed={state.revealedStep >= 3}
                onReveal={state.revealNext}
              >
                <div className="mt-3 text-center">
                  {r.txIdChanged ? (
                    <AttackResultBadge
                      variant="compromised"
                      label="TxID changed — malleation succeeded!"
                    />
                  ) : (
                    <AttackResultBadge
                      variant="protected"
                      label="TxID unchanged — SegWit protects!"
                    />
                  )}
                </div>
              </FormulaStep>
            </motion.div>

            {state.revealedStep >= 3 && (
              <motion.div
                variants={STEP_VARIANTS}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <div>
                  <span className={SECTION_LABEL}>Original Transaction</span>
                  <div className="mt-1">
                    <TxHexInspector
                      serializedHex={r.originalTxHex}
                      segments={r.originalSegments}
                      isSegWit={state.txMode === "segwit"}
                      changedBytes={r.changedBytes}
                    />
                  </div>
                </div>
                <div>
                  <span className={SECTION_LABEL}>Malleated Transaction</span>
                  <div className="mt-1">
                    <TxHexInspector
                      serializedHex={r.malleatedTxHex}
                      segments={r.malleatedSegments}
                      isSegWit={state.txMode === "segwit"}
                      changedBytes={r.changedBytes}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
