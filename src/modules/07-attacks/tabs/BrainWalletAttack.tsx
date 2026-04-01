import { motion, AnimatePresence } from "framer-motion";
import { HexBox, ValueFlowArrow } from "../../../shared/components/index.ts";
import {
  BTN_PRIMARY,
  INPUT,
  LABEL,
  SECTION_LABEL,
  CONTAINER_VARIANTS,
  STEP_VARIANTS,
} from "../../../shared/components/styles.ts";
import { PillToggle } from "../components/PillToggle.tsx";
import { AttackResultBadge } from "../components/AttackResultBadge.tsx";
import { useBrainWalletState } from "../useBrainWalletState.ts";
import { BRAIN_WALLET_HALL_OF_SHAME } from "../data/brainWalletHallOfShame.ts";

const MODE_OPTIONS = [
  { key: "phrase" as const, label: "Phrase \u2192 SHA-256" },
  { key: "custom-bytes" as const, label: "Custom 32 bytes" },
];

export function BrainWalletAttack({ onAttackRun }: { onAttackRun?: () => void }) {
  const state = useBrainWalletState();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PillToggle
          options={MODE_OPTIONS}
          value={state.mode}
          onChange={state.setMode}
          label="Input mode"
        />
      </div>

      {state.mode === "phrase" ? (
        <div>
          <label className={LABEL} htmlFor="brain-phrase">
            Passphrase
          </label>
          <input
            id="brain-phrase"
            type="text"
            className={INPUT}
            value={state.phrase}
            onChange={(e) => state.setPhrase(e.target.value)}
            placeholder="Type any phrase\u2026"
          />
        </div>
      ) : (
        <div>
          <label className={LABEL} htmlFor="brain-hex">
            Custom Hex (32 bytes)
          </label>
          <input
            id="brain-hex"
            type="text"
            className={INPUT}
            value={state.customHex}
            onChange={(e) => state.setCustomHex(e.target.value)}
            placeholder="64 hex characters\u2026"
          />
          {state.customHexError && (
            <p className="mt-1.5 text-sm text-danger">{state.customHexError}</p>
          )}
        </div>
      )}

      <ValueFlowArrow
        label="Key Derivation"
        description={
          state.mode === "phrase"
            ? "passphrase \u2192 SHA-256 \u2192 private key \u2192 public key \u2192 address"
            : "hex bytes \u2192 private key \u2192 public key \u2192 address"
        }
        animationKey={state.mode}
      />

      <AnimatePresence initial={false}>
        {state.phraseDerived && (
          <motion.div
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-3"
          >
            <motion.div variants={STEP_VARIANTS}>
              <HexBox
                value={state.phraseDerived.privKeyHex}
                label={state.mode === "phrase" ? "Private Key (SHA-256 of phrase)" : "Private Key"}
                variant="danger"
                truncate
              />
            </motion.div>
            <motion.div variants={STEP_VARIANTS}>
              <HexBox
                value={state.phraseDerived.pubKeyHex}
                label="Public Key (compressed)"
                variant="info"
                truncate
              />
            </motion.div>
            <motion.div variants={STEP_VARIANTS}>
              <HexBox value={state.phraseDerived.address} label="P2PKH Address" variant="default" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {state.hallOfShameMatch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-input border border-danger/30 bg-danger/5 p-4 space-y-2">
              <AttackResultBadge variant="compromised" label="Known brain wallet phrase!" />
              <p className="text-sm text-text-secondary">
                This exact phrase has been precomputed and swept.{" "}
                <span className="font-semibold text-danger">{state.hallOfShameMatch.note}</span>
              </p>
              <p className="font-mono text-xs text-text-muted">
                Address: {state.hallOfShameMatch.address}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <span className={SECTION_LABEL}>Entropy Comparison</span>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-input border border-danger/20 p-5 space-y-3">
            <span className={SECTION_LABEL}>Deterministic (Guessable)</span>
            {state.phraseDerived ? (
              <>
                <HexBox
                  value={state.phraseDerived.privKeyHex}
                  label="Private Key"
                  variant="danger"
                  truncate
                />
                <HexBox value={state.phraseDerived.address} label="Address" variant="default" />
                <p className="text-sm text-text-secondary">Derived from human-chosen phrase</p>
              </>
            ) : (
              <p className="text-sm text-text-muted">Type a phrase to derive a key</p>
            )}
          </div>

          <div className="rounded-input border border-success/20 p-5 space-y-3">
            <span className={SECTION_LABEL}>Cryptographic RNG</span>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => {
                state.generateRngKey();
                onAttackRun?.();
              }}
            >
              Generate Random Key
            </button>
            {state.rngDerived && (
              <>
                <HexBox
                  value={state.rngDerived.privKeyHex}
                  label="Private Key"
                  variant="success"
                  truncate
                />
                <HexBox value={state.rngDerived.address} label="Address" variant="default" />
                <p className="text-sm text-text-secondary">
                  Source: crypto.getRandomValues (CSPRNG)
                </p>
                <p className="text-sm font-semibold text-success">
                  ~2<sup>256</sup> possible keys &mdash; not guessable
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <span className={SECTION_LABEL}>Hall of Shame: Known Brain Wallet Passphrases</span>
        <div className="mt-3 max-h-64 overflow-y-auto rounded-input border border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Passphrase</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Address</th>
                <th className="px-3 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {BRAIN_WALLET_HALL_OF_SHAME.map((entry) => {
                const isMatch =
                  state.mode === "phrase" &&
                  entry.passphrase.toLowerCase() === state.phrase.toLowerCase();
                return (
                  <tr key={entry.passphrase} className={isMatch ? "bg-danger/10" : ""}>
                    <td className="px-3 py-2 font-mono text-xs text-text-primary">
                      {entry.passphrase}
                    </td>
                    <td className="hidden px-3 py-2 font-mono text-xs text-text-muted sm:table-cell">
                      {entry.address.slice(0, 12)}&hellip;
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-danger">Swept &#x2705;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
