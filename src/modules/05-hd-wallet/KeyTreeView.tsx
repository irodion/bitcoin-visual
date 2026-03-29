import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { HexBox, SecurityCallout, CopyButton } from "../../shared/components/index.ts";
import { BTN_GHOST, BTN_PRIMARY } from "../../shared/components/styles.ts";
import type { DerivedTree, AddressEntry } from "./useHDState.ts";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

interface KeyTreeViewProps {
  derivedTree: DerivedTree | null;
  privateKeysRevealed: boolean;
  setPrivateKeysRevealed: (r: boolean) => void;
}

function AddressList({
  entries,
  label,
  privateKeysRevealed,
}: {
  entries: AddressEntry[];
  label: string;
  privateKeysRevealed: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
        {label}
      </p>
      <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-2">
        {entries.map((entry) => (
          <motion.div
            key={entry.path}
            variants={itemVariants}
            className="rounded-inner border border-border bg-surface-raised p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                {entry.index}
              </span>
              <span className="font-mono text-[11px] text-text-muted">{entry.path}</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-success">
                {entry.address}
              </code>
              <CopyButton text={entry.address} />
            </div>
            {privateKeysRevealed && (
              <div className="mt-2">
                <HexBox
                  value={entry.privateKey}
                  label="Private Key"
                  variant="danger"
                  truncate
                  maxLength={40}
                />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function KeyTreeView({
  derivedTree,
  privateKeysRevealed,
  setPrivateKeysRevealed,
}: KeyTreeViewProps) {
  const [showWarning, setShowWarning] = useState(false);

  if (!derivedTree) return null;

  return (
    <div className="panel-cool rounded-section border border-border p-6">
      <h3 className="mb-1 text-lg font-bold text-text-primary">Key Tree</h3>
      <p className="mb-4 text-sm text-text-muted">
        BIP44 tree: first 5 addresses per branch (external + change)
      </p>

      <div className="mb-5 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded-badge bg-accent/10 px-2 py-0.5 font-mono text-xs font-bold text-accent">
            m
          </span>
          <span className="text-text-muted">→</span>
          {derivedTree.pathNodes.map((node, i) => (
            <span key={node.path} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted">→</span>}
              <span className="rounded-badge bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-primary">
                {node.path.split("/").pop()}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="mb-5">
        {!privateKeysRevealed && !showWarning && (
          <button type="button" onClick={() => setShowWarning(true)} className={BTN_GHOST}>
            Reveal Private Keys
          </button>
        )}

        {showWarning && !privateKeysRevealed && (
          <div className="space-y-3">
            <SecurityCallout variant="danger">
              If an attacker obtains your account xpub AND any single child private key from a
              non-hardened derivation, they can compute the parent private key and derive ALL
              sibling private keys. Never expose account xpub and child private keys together.
            </SecurityCallout>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrivateKeysRevealed(true);
                  setShowWarning(false);
                }}
                className={BTN_PRIMARY}
              >
                I understand the risk
              </button>
              <button type="button" onClick={() => setShowWarning(false)} className={BTN_GHOST}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {privateKeysRevealed && (
          <button type="button" onClick={() => setPrivateKeysRevealed(false)} className={BTN_GHOST}>
            Hide Private Keys
          </button>
        )}
      </div>

      <div className="space-y-6">
        <AddressList
          entries={derivedTree.externalAddresses}
          label="External (Receiving) — /0"
          privateKeysRevealed={privateKeysRevealed}
        />
        <AddressList
          entries={derivedTree.changeAddresses}
          label="Change — /1"
          privateKeysRevealed={privateKeysRevealed}
        />
      </div>

      <div className="mt-5">
        <SecurityCallout variant="warning">
          HD wallets derive all keys from a single seed. If your mnemonic is compromised, every
          address in the tree is at risk. Store your mnemonic securely and never share it.
        </SecurityCallout>
      </div>
    </div>
  );
}
