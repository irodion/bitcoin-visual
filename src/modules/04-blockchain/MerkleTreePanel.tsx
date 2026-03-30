import { useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { motion, AnimatePresence } from "framer-motion";
import type { MerkleProofStep } from "../../shared/crypto/merkle.ts";
import type { BlockData } from "./constants.ts";

interface MerkleTreePanelProps {
  block: BlockData;
  merkleTree: Uint8Array[][];
  selectedTxIndex: number | null;
  merkleProof: MerkleProofStep[] | null;
  onSelectTransaction: (index: number | null) => void;
}

export function MerkleTreePanel({
  block,
  merkleTree,
  selectedTxIndex,
  merkleProof,
  onSelectTransaction,
}: MerkleTreePanelProps) {
  // Build a set of highlighted node hashes for the proof path:
  // the selected leaf, its siblings at each level, and ancestor (parent) nodes.
  const proofHashSet = useMemo(() => {
    if (!merkleProof || selectedTxIndex === null) return new Set<string>();
    const set = new Set<string>();

    // Add the selected leaf
    if (block.transactions[selectedTxIndex]) {
      set.add(bytesToHex(block.transactions[selectedTxIndex].txid));
    }

    // Add sibling hashes from the proof
    for (const step of merkleProof) {
      set.add(bytesToHex(step.hash));
    }

    // Walk up the tree to add ancestor (parent) nodes
    let idx = selectedTxIndex;
    for (let level = 1; level < merkleTree.length; level++) {
      const parentIdx = Math.floor(idx / 2);
      if (merkleTree[level][parentIdx]) {
        set.add(bytesToHex(merkleTree[level][parentIdx]));
      }
      idx = parentIdx;
    }

    return set;
  }, [merkleProof, selectedTxIndex, block.transactions, merkleTree]);

  const hasActiveProof = selectedTxIndex !== null && merkleProof !== null;

  const reversedLevels = useMemo(() => [...merkleTree].reverse(), [merkleTree]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="overflow-hidden rounded-card border border-border bg-surface-raised p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">
            Merkle Tree — Block #{block.index}
          </h3>
          {block.transactions.length > 0 && (
            <span className="text-[11px] text-text-secondary">
              {block.transactions.length} transactions
            </span>
          )}
        </div>

        {/* Tree visualization — top-down (root at top, leaves at bottom) */}
        <div className="space-y-3">
          {reversedLevels.map((level, levelIdx) => {
            const isRoot = levelIdx === 0;
            const isLeaves = levelIdx === reversedLevels.length - 1;

            return (
              <div key={levelIdx} className="flex flex-wrap justify-center gap-2">
                {level.map((nodeHash, nodeIdx) => {
                  const hex = bytesToHex(nodeHash);
                  const short = hex.slice(0, 8);
                  const isInProof = proofHashSet.has(hex);
                  const isClickable = isLeaves;
                  const isSelectedLeaf = isLeaves && selectedTxIndex === nodeIdx;

                  const dimmed = hasActiveProof && !isInProof && !isRoot;

                  return (
                    <button
                      key={`${levelIdx}-${nodeIdx}`}
                      type="button"
                      onClick={
                        isClickable
                          ? () => onSelectTransaction(isSelectedLeaf ? null : nodeIdx)
                          : undefined
                      }
                      disabled={!isClickable}
                      title={hex}
                      className={`rounded-pill border px-3 py-1.5 font-mono text-[11px] transition-all ${
                        isRoot
                          ? "border-success/40 bg-success/10 font-bold text-success"
                          : isSelectedLeaf
                            ? "border-accent bg-accent/20 font-semibold text-accent"
                            : isInProof
                              ? "border-accent/60 bg-accent/10 text-accent"
                              : "border-border bg-surface text-text-secondary"
                      } ${dimmed ? "opacity-30" : "opacity-100"} ${
                        isClickable ? "cursor-pointer hover:border-accent/60" : "cursor-default"
                      }`}
                    >
                      {isRoot && (
                        <span className="mr-1.5 text-[9px] uppercase tracking-wider">Root </span>
                      )}
                      {short}
                      {isLeaves && block.transactions[nodeIdx] && (
                        <span className="ml-1.5 max-w-[100px] truncate font-sans text-[10px] text-text-muted">
                          {block.transactions[nodeIdx].data.slice(0, 12)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* SPV proof info */}
        {hasActiveProof && merkleProof && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-inner border border-accent/20 bg-accent/5 px-4 py-3"
          >
            <p className="text-sm text-text-primary">
              To verify{" "}
              <strong className="text-accent">
                {block.transactions[selectedTxIndex!]?.data ?? `TX-${selectedTxIndex}`}
              </strong>{" "}
              is in this block, you only need{" "}
              <strong className="text-accent">
                {merkleProof.length} hash{merkleProof.length !== 1 ? "es" : ""}
              </strong>
              , not all {block.transactions.length} transactions.
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Proof size: {merkleProof.length} · Total transactions: {block.transactions.length} ·
              Compression:{" "}
              {block.transactions.length > 1
                ? `${Math.round((1 - merkleProof.length / block.transactions.length) * 100)}%`
                : "N/A"}
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
