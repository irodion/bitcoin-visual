import { motion, AnimatePresence } from "framer-motion";
import { HexBox, ValueFlowArrow } from "../../../shared/components/index.ts";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  INPUT,
  LABEL,
  SECTION_LABEL,
  CONTAINER_VARIANTS,
  STEP_VARIANTS,
} from "../../../shared/components/styles.ts";
import { FormulaStep } from "../components/FormulaStep.tsx";
import { AttackResultBadge } from "../components/AttackResultBadge.tsx";
import { PillToggle } from "../components/PillToggle.tsx";
import { useNonceReuseState } from "../useNonceReuseState.ts";
import { SECP256K1_N_HEX } from "../attackUtils.ts";

const NONCE_OPTIONS = [
  { key: "same" as const, label: "Same nonce k" },
  { key: "different" as const, label: "Different nonce" },
];

export function NonceReuseAttack({ onAttackRun }: { onAttackRun?: () => void }) {
  const state = useNonceReuseState();
  const sr = state.signResult;
  const rMatch = sr ? sr.sig1.r === sr.sig2.r : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={BTN_GHOST} onClick={state.regenerate}>
          Regenerate
        </button>
        <PillToggle
          options={NONCE_OPTIONS}
          value={state.nonceMode}
          onChange={state.setNonceMode}
          label="Nonce mode"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="msg1">
            Message 1
          </label>
          <input
            id="msg1"
            type="text"
            className={INPUT}
            value={state.message1}
            onChange={(e) => state.setMessage1(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="msg2">
            Message 2
          </label>
          <input
            id="msg2"
            type="text"
            className={INPUT}
            value={state.message2}
            onChange={(e) => state.setMessage2(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className={`${BTN_PRIMARY} mx-auto block`}
        onClick={() => {
          state.signBoth();
          onAttackRun?.();
        }}
      >
        Sign Both Messages
      </button>

      <AnimatePresence initial={false}>
        {sr && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <span className={SECTION_LABEL}>Nonce Indicator</span>
              {rMatch ? (
                <AttackResultBadge variant="compromised" label="r₁ === r₂ — Nonce Reused" />
              ) : (
                <AttackResultBadge variant="protected" label="r₁ ≠ r₂ — Protected" />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-input border border-border p-4">
                <div className="text-sm font-semibold text-text-primary">Signature 1</div>
                <HexBox value={sr.sig1.rHex} label="r" variant="default" truncate />
                <HexBox value={sr.sig1.sHex} label="s₁" variant="default" truncate />
              </div>
              <div className="space-y-2 rounded-input border border-border p-4">
                <div className="text-sm font-semibold text-text-primary">Signature 2</div>
                <HexBox value={sr.sig2.rHex} label="r" variant="default" truncate />
                <HexBox value={sr.sig2.sHex} label="s₂" variant="default" truncate />
              </div>
            </div>

            <ValueFlowArrow
              label="Attack"
              description={
                rMatch
                  ? "Same r means same nonce k \u2014 algebraic recovery is possible"
                  : "Different r means different k \u2014 attack is not possible"
              }
              animationKey={`${sr.sig1.rHex}-${sr.sig2.rHex}`}
            />

            {rMatch ? (
              <motion.div
                variants={CONTAINER_VARIANTS}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <FormulaStep
                  stepNumber={1}
                  title="Recover Nonce k"
                  symbolic="k = (z₁ − z₂) · (s₁ − s₂)⁻¹ mod n"
                  substitutions={[
                    { label: "z\u2081 = SHA-256(msg1)", value: sr.z1Hex },
                    { label: "z\u2082 = SHA-256(msg2)", value: sr.z2Hex },
                    { label: "s\u2081", value: sr.sig1.sHex },
                    { label: "s\u2082", value: sr.sig2.sHex },
                    { label: "n (curve order)", value: SECP256K1_N_HEX },
                  ]}
                  result={
                    sr.recoveredKHex
                      ? { label: "Recovered k", value: sr.recoveredKHex, variant: "default" }
                      : undefined
                  }
                  revealed={state.revealedStep >= 0}
                  onReveal={state.revealNext}
                />

                <FormulaStep
                  stepNumber={2}
                  title="Recover Private Key"
                  symbolic="d = (s₁ · k − z₁) · r⁻¹ mod n"
                  substitutions={[
                    { label: "s\u2081", value: sr.sig1.sHex },
                    { label: "k (recovered)", value: sr.recoveredKHex ?? "" },
                    { label: "z\u2081", value: sr.z1Hex },
                    { label: "r", value: sr.sig1.rHex },
                  ]}
                  result={
                    sr.recoveredPrivKeyHex
                      ? {
                          label: "Recovered Private Key",
                          value: sr.recoveredPrivKeyHex,
                          variant: "danger",
                        }
                      : undefined
                  }
                  revealed={state.revealedStep >= 1}
                  onReveal={state.revealNext}
                />

                <FormulaStep
                  stepNumber={3}
                  title="Verify Recovery"
                  symbolic="recovered_d === original_d ?"
                  substitutions={[
                    { label: "Recovered", value: sr.recoveredPrivKeyHex ?? "" },
                    { label: "Original", value: state.privateKeyHex },
                  ]}
                  result={
                    state.keysMatch != null
                      ? {
                          label: state.keysMatch ? "Match confirmed" : "Mismatch",
                          value: state.privateKeyHex,
                          variant: state.keysMatch ? "success" : "danger",
                        }
                      : undefined
                  }
                  status={state.keysMatch ? "success" : undefined}
                  revealed={state.revealedStep >= 2}
                  onReveal={state.revealNext}
                />

                {state.keysMatch && state.revealedStep >= 2 && (
                  <motion.div variants={STEP_VARIANTS} className="text-center">
                    <AttackResultBadge
                      variant="compromised"
                      label="Private key fully recovered from nonce reuse"
                    />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="rounded-input border border-success/30 p-5 text-center">
                <AttackResultBadge
                  variant="protected"
                  label="Attack blocked — unique nonces produce different r values"
                />
                <p className="mt-3 text-sm text-text-secondary">
                  With different nonces, there is no algebraic relationship between the two
                  signatures that can be exploited. The private key remains safe.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
