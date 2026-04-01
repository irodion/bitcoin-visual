import { motion, AnimatePresence } from "framer-motion";
import { HexBox, ValueFlowArrow } from "../../../shared/components/index.ts";
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
import { useXpubLeakState, type SiblingEntry } from "../useXpubLeakState.ts";

const DERIVATION_OPTIONS = [
  { key: "normal" as const, label: "Normal" },
  { key: "hardened" as const, label: "Hardened" },
  { key: "compare" as const, label: "Compare" },
];

function SiblingList({ entries }: { entries: SiblingEntry[] }) {
  return (
    <div className="space-y-2">
      <div className={SECTION_LABEL}>Derived Sibling Keys ({entries.length})</div>
      <ul className="space-y-1.5" role="list">
        {entries.map((entry) => (
          <li
            key={entry.index}
            className="flex flex-wrap items-center gap-3 rounded-callout border border-border bg-surface-raised px-4 py-2.5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
              {entry.index}
            </span>
            <span className="max-w-[200px] truncate font-mono text-xs text-danger">
              {entry.privKeyHex}
            </span>
            <span className="font-mono text-xs text-text-secondary">{entry.address}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AttackResultsProps {
  mode: "normal" | "hardened";
  chainCodeHex: string;
  childPrivKeyHex: string;
  hmacILHex: string | null;
  recoveredHex: string | null;
  errorMsg: string | null;
  siblings: SiblingEntry[];
  revealedStep: number;
  onReveal: () => void;
}

function AttackResults({
  mode,
  chainCodeHex,
  childPrivKeyHex,
  hmacILHex,
  recoveredHex,
  errorMsg,
  siblings,
  revealedStep,
  onReveal,
}: AttackResultsProps) {
  const isNormal = mode === "normal";

  return (
    <div className="space-y-4">
      <FormulaStep
        stepNumber={1}
        title="Extract Chain Code"
        symbolic="chainCode = xpub.chainCode"
        result={{ label: "Chain Code", value: chainCodeHex, variant: "info" }}
        revealed={revealedStep >= 0}
        onReveal={onReveal}
      />

      <FormulaStep
        stepNumber={2}
        title="Compute Parent Private Key"
        symbolic={
          isNormal
            ? "parentPriv = childPriv − HMAC-SHA512(chainCode, pubKey ‖ index)[:32] mod n"
            : "parentPriv = childPriv − HMAC-SHA512(chainCode, parentPrivKey ‖ index)[:32] mod n"
        }
        substitutions={
          isNormal && hmacILHex
            ? [
                { label: "childPriv", value: childPrivKeyHex },
                { label: "HMAC IL (first 32 bytes)", value: hmacILHex },
              ]
            : undefined
        }
        result={
          recoveredHex
            ? { label: "Recovered Parent Private Key", value: recoveredHex, variant: "danger" }
            : undefined
        }
        status={errorMsg ? "failure" : recoveredHex ? "success" : undefined}
        failureMessage={errorMsg ?? undefined}
        revealed={revealedStep >= 1}
        onReveal={onReveal}
      />

      {isNormal && recoveredHex ? (
        <FormulaStep
          stepNumber={3}
          title="Derive All Sibling Keys"
          symbolic="for i in 0..7: child[i] = HDKey(parentPriv, chainCode).deriveChild(i)"
          result={{ label: "Parent Private Key", value: recoveredHex, variant: "danger" }}
          revealed={revealedStep >= 2}
          onReveal={onReveal}
        />
      ) : (
        !isNormal && (
          <FormulaStep
            stepNumber={3}
            title="Derive Sibling Keys"
            symbolic="Cannot derive — parent key unknown"
            status="failure"
            failureMessage="Hardened derivation prevents parent key recovery. No siblings can be derived."
            revealed={revealedStep >= 2}
            onReveal={onReveal}
          />
        )
      )}

      {isNormal && siblings.length > 0 && revealedStep >= 2 && (
        <motion.div variants={STEP_VARIANTS}>
          <SiblingList entries={siblings} />
        </motion.div>
      )}

      <motion.div variants={STEP_VARIANTS} className="text-center">
        {isNormal ? (
          <AttackResultBadge
            variant="compromised"
            label="Parent key recovered — all sibling keys compromised"
          />
        ) : (
          <AttackResultBadge variant="protected" label="Hardened derivation — parent key safe" />
        )}
      </motion.div>
    </div>
  );
}

function resolveAttackResultsProps(
  state: ReturnType<typeof useXpubLeakState>,
  mode: "normal" | "hardened",
): Omit<AttackResultsProps, "mode"> | null {
  const isNormal = mode === "normal";
  const hasResults = isNormal
    ? (state.compareNormal ?? state.recoveredParentPrivHex)
    : (state.compareHardened ?? state.attackError);

  if (!hasResults) return null;

  return {
    chainCodeHex: state.chainCodeHex,
    childPrivKeyHex: state.childPrivKeyHex,
    hmacILHex: state.hmacILHex,
    recoveredHex: isNormal
      ? (state.compareNormal?.recoveredHex ?? state.recoveredParentPrivHex)
      : null,
    errorMsg: isNormal ? null : (state.compareHardened?.error ?? state.attackError),
    siblings: isNormal ? (state.compareNormal?.siblings ?? state.siblings) : [],
    revealedStep: state.revealedStep,
    onReveal: state.revealNext,
  };
}

export function XpubLeakAttack({ onAttackRun }: { onAttackRun?: () => void }) {
  const state = useXpubLeakState();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={BTN_GHOST} onClick={state.regenerate}>
          Regenerate
        </button>
        <PillToggle
          options={DERIVATION_OPTIONS}
          value={state.derivationMode}
          onChange={state.setDerivationMode}
          label="Derivation mode"
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

      <div className="space-y-3">
        <HexBox value={state.seedHex} label="Master Seed" variant="danger" truncate />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <HexBox value={state.xpubPubHex} label="xpub Public Key (m/0)" variant="info" truncate />
          <HexBox value={state.chainCodeHex} label="Chain Code" variant="info" truncate />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-badge bg-badge-bg px-2.5 py-1 font-mono text-[11px] text-text-secondary">
            {state.derivationPath}
          </span>
          <span className="text-sm text-text-secondary">
            Derivation path ({state.derivationMode === "hardened" ? "hardened" : "normal"})
          </span>
        </div>
        <HexBox
          value={state.childPrivKeyHex}
          label={`Leaked Child Private Key (index ${state.childIndex})`}
          variant="danger"
          truncate
        />
      </div>

      <button
        type="button"
        className={`${BTN_PRIMARY} mx-auto block`}
        onClick={() => {
          state.runAttack();
          onAttackRun?.();
        }}
      >
        Run Attack
      </button>

      <AnimatePresence initial={false}>
        {state.attacked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5 overflow-hidden"
          >
            <ValueFlowArrow
              label="xpub Attack"
              description="Reverse BIP-32 normal derivation to recover parent private key"
              animationKey={state.seedHex}
            />

            {state.derivationMode === "compare" ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-section border border-danger/20 p-5">
                  <div className="text-sm font-semibold text-danger">Normal Derivation (m/0)</div>
                  <motion.div variants={CONTAINER_VARIANTS} initial="hidden" animate="visible">
                    {(() => {
                      const props = resolveAttackResultsProps(state, "normal");
                      return props ? <AttackResults mode="normal" {...props} /> : null;
                    })()}
                  </motion.div>
                </div>
                <div className="space-y-4 rounded-section border border-success/20 p-5">
                  <div className="text-sm font-semibold text-success">
                    Hardened Derivation (m/0&apos;)
                  </div>
                  <motion.div variants={CONTAINER_VARIANTS} initial="hidden" animate="visible">
                    {(() => {
                      const props = resolveAttackResultsProps(state, "hardened");
                      return props ? <AttackResults mode="hardened" {...props} /> : null;
                    })()}
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.div
                variants={CONTAINER_VARIANTS}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {(() => {
                  const mode = state.derivationMode === "hardened" ? "hardened" : "normal";
                  const props = resolveAttackResultsProps(state, mode);
                  return props ? <AttackResults mode={mode} {...props} /> : null;
                })()}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
