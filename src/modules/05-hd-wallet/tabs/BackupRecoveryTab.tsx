import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { SecurityCallout, CopyButton } from "../../../shared/components/index.ts";
import {
  BTN_PRIMARY,
  BTN_DANGER,
  BTN_GHOST,
  CONTAINER_VARIANTS,
  STEP_VARIANTS,
} from "../../../shared/components/styles.ts";
import { WordPillGrid } from "../WordPillGrid.tsx";
import type { HDState } from "../useHDState.ts";
import { useBackupDemoState } from "../useBackupDemoState.ts";
import type { BackupDemoState } from "../useBackupDemoState.ts";

const PHASE_MESSAGES: Record<string, string> = {
  idle: "",
  created: "Wallet created. Save your seed phrase before continuing.",
  destroyed: "Wallet destroyed. Your device is gone.",
  restoring: "Restoring wallet from seed phrase…",
  success: "Wallet restored successfully. Addresses match.",
};

const DESTROY_EXIT: Variants = {
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    scale: 0.85,
    filter: "blur(4px)",
    transition: { duration: 0.4, ease: "easeIn" },
  },
};

const CHECKMARK_VARIANTS: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 20, delay: i * 0.1 },
  }),
};

interface BackupRecoveryTabProps {
  hdState: HDState;
}

export function BackupRecoveryTab({ hdState }: BackupRecoveryTabProps) {
  const demo = useBackupDemoState(hdState);

  return (
    <div className="mx-auto max-w-3xl">
      <PhaseAnnouncer phase={demo.phase} />
      <AnimatePresence mode="wait">
        {demo.phase === "idle" && (
          <PhaseWrapper key="idle">
            <IdlePhase onStart={demo.startDemo} />
          </PhaseWrapper>
        )}
        {demo.phase === "created" && (
          <PhaseWrapper key="created">
            <CreatedPhase
              demo={demo}
              words={hdState.words}
              isDerivingSeed={hdState.isDerivingSeed}
            />
          </PhaseWrapper>
        )}
        {demo.phase === "destroyed" && (
          <PhaseWrapper key="destroyed">
            <DestroyedPhase savedAddresses={demo.savedAddresses} onRecover={demo.pasteAndRestore} />
          </PhaseWrapper>
        )}
        {demo.phase === "restoring" && (
          <PhaseWrapper key="restoring">
            <RestoringPhase />
          </PhaseWrapper>
        )}
        {demo.phase === "success" && (
          <PhaseWrapper key="success">
            <SuccessPhase demo={demo} />
          </PhaseWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={STEP_VARIANTS} initial="hidden" animate="visible" exit="hidden">
      {children}
    </motion.div>
  );
}

function PhaseAnnouncer({ phase }: { phase: string }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {PHASE_MESSAGES[phase]}
    </div>
  );
}

/* ── Idle ─────────────────────────────────────────────── */

function IdlePhase({ onStart }: { onStart: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="panel-cool rounded-section border border-border p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path
              d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-text-primary">
          What happens when you lose your device?
        </h3>
        <p className="mx-auto mb-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          This interactive demo walks you through creating a wallet, losing it, and recovering it
          from your seed phrase alone.
        </p>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-text-muted">
          ~3.8 million BTC are estimated lost forever — because their owners lost their keys. There
          is no password reset.
        </p>
      </div>

      <div className="flex justify-center">
        <button ref={btnRef} type="button" onClick={onStart} className={BTN_PRIMARY}>
          Start Demo
        </button>
      </div>
    </div>
  );
}

/* ── Created ──────────────────────────────────────────── */

function CreatedPhase({
  demo,
  words,
  isDerivingSeed,
}: {
  demo: BackupDemoState;
  words: Array<{ word: string; index: number }>;
  isDerivingSeed: boolean;
}) {
  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <motion.div variants={STEP_VARIANTS}>
        <div className="panel-cool rounded-section border border-border p-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Your Seed Phrase
            </h4>
            {demo.savedMnemonic && <CopyButton text={demo.savedMnemonic} />}
          </div>

          {words.length > 0 ? (
            <WordPillGrid words={words} className="mb-4" />
          ) : (
            <div className="flex h-24 items-center justify-center">
              <span className="animate-pulse text-sm text-text-muted">Generating…</span>
            </div>
          )}

          <SecurityCallout variant="warning">
            <strong>Save your seed phrase</strong> — you will need it to recover your wallet. In a
            real wallet, write these words on paper and store them securely. Never screenshot them.
          </SecurityCallout>
        </div>
      </motion.div>

      {isDerivingSeed && (
        <motion.div variants={STEP_VARIANTS}>
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span className="text-sm text-text-muted">Deriving seed (PBKDF2, 2048 rounds)…</span>
          </div>
        </motion.div>
      )}

      {demo.savedAddresses.length > 0 && (
        <motion.div variants={STEP_VARIANTS}>
          <div className="panel-cool rounded-section border border-border p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-muted">
              Your Wallet — 3 Receiving Addresses
            </h4>
            <div className="space-y-2">
              {demo.savedAddresses.map((addr, i) => (
                <AddressCard key={addr} index={i} address={addr} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {demo.savedAddresses.length > 0 && (
        <motion.div variants={STEP_VARIANTS} className="space-y-3">
          {!demo.userConfirmedSave ? (
            <div className="flex justify-center">
              <button type="button" onClick={demo.confirmSaved} className={BTN_GHOST}>
                I've saved my seed phrase
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button type="button" onClick={demo.destroyWallet} className={BTN_DANGER}>
                Simulate Device Loss
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Destroyed ────────────────────────────────────────── */

function DestroyedPhase({
  savedAddresses,
  onRecover,
}: {
  savedAddresses: string[];
  onRecover: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="panel-cool rounded-section border border-danger/20 p-6">
        <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-danger/60">
          Wallet Destroyed
        </h4>
        <div className="space-y-2">
          {savedAddresses.map((addr) => (
            <motion.div
              key={addr}
              variants={DESTROY_EXIT}
              initial="visible"
              animate="exit"
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-surface-raised/50 px-4 py-3"
            >
              <span className="font-mono text-sm text-text-muted/30">{addr}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <SecurityCallout variant="danger">
        <strong>Your device is gone.</strong> Your app is deleted. But your coins still exist on the
        blockchain — locked to your public keys, visible to everyone, spendable by no one without
        the private keys.
      </SecurityCallout>

      <div className="panel-cool rounded-section border border-border p-5 text-center">
        <p className="text-sm leading-relaxed text-text-secondary">
          The blockchain is a public ledger maintained by thousands of nodes worldwide. Your coins
          don't live in your wallet app — the app was just a tool to sign transactions. Without your
          seed phrase, nobody can move those coins. Not you. Not anyone.
        </p>
      </div>

      <div className="flex justify-center">
        <button ref={btnRef} type="button" onClick={onRecover} className={BTN_PRIMARY}>
          Recover Wallet
        </button>
      </div>
    </div>
  );
}

/* ── Restoring ────────────────────────────────────────── */

function RestoringPhase() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-text-muted">Deriving seed… same mnemonic, same math, same keys.</p>
    </div>
  );
}

/* ── Success ──────────────────────────────────────────── */

function SuccessPhase({ demo }: { demo: BackupDemoState }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Small delay so the animation plays first
    const id = setTimeout(() => btnRef.current?.focus(), 600);
    return () => clearTimeout(id);
  }, []);

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <motion.div variants={STEP_VARIANTS}>
        <div className="panel-cool rounded-section border border-success/30 p-6">
          <h4 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-success">
            Wallet Restored
          </h4>

          <div className="space-y-3">
            {demo.savedAddresses.map((original, i) => {
              const restored = demo.restoredAddresses[i] as string | undefined;
              const match = restored !== undefined && original === restored;
              return (
                <div
                  key={original}
                  className="rounded-lg border border-border bg-surface-raised p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-inset text-[10px] font-bold text-text-muted">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                      Address {i + 1}
                    </span>
                    {match && (
                      <motion.span
                        custom={i}
                        variants={CHECKMARK_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-success"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Match
                      </motion.span>
                    )}
                  </div>
                  <div className="grid gap-1 md:grid-cols-2">
                    <div>
                      <span className="text-[10px] text-text-muted">Original</span>
                      <p className="break-all font-mono text-xs text-text-primary">{original}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted">Restored</span>
                      <p className="break-all font-mono text-xs text-success">{restored ?? "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div variants={STEP_VARIANTS}>
        <SecurityCallout variant="warning">
          <strong>Same seed → same keys → same addresses.</strong> Your wallet was never "in" the
          device — the app is just a viewer. This is why your seed phrase backup is so critical.
          Lose it, and no one — not even the network — can recover your funds.
        </SecurityCallout>
      </motion.div>

      <motion.div variants={STEP_VARIANTS} className="flex justify-center">
        <button ref={btnRef} type="button" onClick={demo.resetDemo} className={BTN_GHOST}>
          Try Again
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Shared ───────────────────────────────────────────── */

function AddressCard({ index, address }: { index: number; address: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-inset text-[10px] font-bold text-text-muted">
        {index + 1}
      </span>
      <span className="break-all font-mono text-sm text-success">{address}</span>
    </div>
  );
}
