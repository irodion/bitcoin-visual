import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { motion, AnimatePresence } from "framer-motion";
import type { MerkleProofStep } from "../../shared/crypto/merkle.ts";
import { STEP_VARIANTS } from "../../shared/components/styles.ts";
import type { BlockData } from "./constants.ts";
import { buildTreeEdges, buildProofEdgeMap, nodeKey } from "./merkleLayout.ts";
import { MerkleTreeConnectors } from "./MerkleTreeConnectors.tsx";
import { ProofWalkControls } from "./ProofWalkControls.tsx";

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
  const [walkStep, setWalkStep] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());

  const maxStep = merkleProof ? merkleProof.length - 1 : 0;

  useEffect(() => {
    setWalkStep(null);
    setAutoPlay(false);
  }, [selectedTxIndex]);

  // Auto-play interval — self-stops at last step to avoid no-op updates
  useEffect(() => {
    if (!autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setWalkStep((s) => {
        const next = s !== null ? Math.min(s + 1, maxStep) : 0;
        if (next >= maxStep) setAutoPlay(false);
        return next;
      });
    }, 800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, maxStep]);

  // Bitcoin duplicates the last node when a level has odd count.
  // We pad the tree to make this visible as ghost nodes.
  const paddedLevels = useMemo(() => {
    return merkleTree.map((level) => {
      if (level.length > 1 && level.length % 2 === 1) {
        return [...level, level[level.length - 1]];
      }
      return level;
    });
  }, [merkleTree]);

  const ghostPositions = useMemo(() => {
    const set = new Set<string>();
    for (let level = 0; level < merkleTree.length; level++) {
      if (merkleTree[level].length > 1 && merkleTree[level].length % 2 === 1) {
        set.add(nodeKey(level, merkleTree[level].length));
      }
    }
    return set;
  }, [merkleTree]);

  const treeEdges = useMemo(() => buildTreeEdges(paddedLevels), [paddedLevels]);

  const proofEdgeMap = useMemo(() => {
    if (!merkleProof || selectedTxIndex === null) return new Map<string, never>();
    return buildProofEdgeMap(paddedLevels, merkleProof, selectedTxIndex);
  }, [paddedLevels, merkleProof, selectedTxIndex]);

  // Pre-compute hex strings for every node to avoid repeated bytesToHex in the render loop
  const hexTree = useMemo(() => {
    return paddedLevels.map((level) => level.map((hash) => bytesToHex(hash)));
  }, [paddedLevels]);

  // Highlighted proof-path hashes, respecting walk mode.
  // siblingHexSet tracks sibling (provided) hashes so they can be styled differently (teal).
  const { proofHashSet, siblingHexSet } = useMemo(() => {
    if (!merkleProof || selectedTxIndex === null)
      return { proofHashSet: new Set<string>(), siblingHexSet: new Set<string>() };

    const proof = new Set<string>();
    const siblings = new Set<string>();

    // Selected leaf — use hexTree (level 0) when possible
    const leafHex = hexTree[0]?.[selectedTxIndex];
    if (leafHex) proof.add(leafHex);

    const stepsToShow = walkStep !== null ? walkStep + 1 : merkleProof.length;

    for (let i = 0; i < stepsToShow; i++) {
      const h = bytesToHex(merkleProof[i].hash);
      proof.add(h);
      siblings.add(h);
    }

    // Ancestor nodes — use pre-computed hexTree instead of bytesToHex
    let idx = selectedTxIndex;
    for (let level = 1; level < merkleTree.length && level <= stepsToShow; level++) {
      const parentIdx = Math.floor(idx / 2);
      const parentHex = hexTree[level]?.[parentIdx];
      if (parentHex) proof.add(parentHex);
      idx = parentIdx;
    }

    return { proofHashSet: proof, siblingHexSet: siblings };
  }, [merkleProof, selectedTxIndex, merkleTree, hexTree, walkStep]);

  const hasActiveProof = selectedTxIndex !== null && merkleProof !== null;

  const reversedLevels = useMemo(() => [...paddedLevels].reverse(), [paddedLevels]);
  const reversedHexTree = useMemo(() => [...hexTree].reverse(), [hexTree]);

  const stepDescription = useMemo(() => {
    if (walkStep === null || !merkleProof || selectedTxIndex === null) return null;
    const step = merkleProof[walkStep];
    if (!step) return null;

    const siblingHex = bytesToHex(step.hash).slice(0, 8);
    const isLastStep = walkStep === merkleProof.length - 1;

    // Detect self-duplicate: sibling hash equals the node's own hash at this level
    let nodeIdx = selectedTxIndex;
    for (let i = 0; i < walkStep; i++) nodeIdx = Math.floor(nodeIdx / 2);
    const nodeHex = hexTree[walkStep]?.[nodeIdx];
    const siblingFullHex = bytesToHex(step.hash);
    const isSelfDup = nodeHex != null && nodeHex === siblingFullHex;

    const siblingLabel = isSelfDup
      ? `a duplicate of itself (${siblingHex}\u2026) \u2014 Bitcoin\u2019s rule for odd-count levels`
      : `its ${step.position === "right" ? "right" : "left"} sibling (${siblingHex}\u2026)`;

    if (walkStep === 0) {
      return `Hash the selected transaction with ${siblingLabel} to compute their parent.`;
    }
    if (isLastStep) {
      return `Hash with ${siblingLabel} to reach the Merkle root. Proof complete!`;
    }
    return `Hash the result from step ${walkStep} with ${siblingLabel} to move one level up.`;
  }, [walkStep, merkleProof, selectedTxIndex, hexTree]);

  const handleToggleWalk = useCallback(() => {
    setWalkStep((w) => (w === null ? 0 : null));
    setAutoPlay(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setWalkStep((s) => Math.min((s ?? -1) + 1, maxStep));
  }, [maxStep]);

  const handleStepBackward = useCallback(() => {
    setWalkStep((s) => Math.max((s ?? 0) - 1, 0));
  }, []);

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => {
      if (prev) return false;
      setWalkStep((s) => (s !== null && s >= maxStep ? 0 : (s ?? 0)));
      return true;
    });
  }, [maxStep]);

  const handleReset = useCallback(() => {
    setWalkStep(0);
    setAutoPlay(false);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        variants={STEP_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="rounded-card border border-border bg-surface-raised p-5"
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

        {hasActiveProof && merkleProof && merkleProof.length > 0 && (
          <ProofWalkControls
            totalSteps={merkleProof.length}
            walkStep={walkStep}
            autoPlay={autoPlay}
            stepDescription={stepDescription}
            onToggleWalk={handleToggleWalk}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onToggleAutoPlay={handleToggleAutoPlay}
            onReset={handleReset}
          />
        )}

        <div ref={containerRef} className="relative space-y-8">
          {reversedLevels.map((level, levelIdx) => {
            const isRoot = levelIdx === 0;
            const isLeaves = levelIdx === reversedLevels.length - 1;
            const origLevel = paddedLevels.length - 1 - levelIdx;
            const levelHexes = reversedHexTree[levelIdx];

            return (
              <div key={levelIdx} className="flex flex-wrap justify-center gap-2">
                {level.map((_nodeHash, nodeIdx) => {
                  const hex = levelHexes[nodeIdx];
                  const short = hex.slice(0, 8);
                  const isInProof = proofHashSet.has(hex);
                  const isSibling = siblingHexSet.has(hex);
                  const refKey = nodeKey(origLevel, nodeIdx);
                  const isGhost = ghostPositions.has(refKey);
                  const isClickable = isLeaves && !isGhost;
                  const isSelectedLeaf = isLeaves && !isGhost && selectedTxIndex === nodeIdx;

                  const dimmed = hasActiveProof && !isInProof && !isRoot;

                  return (
                    <button
                      key={`${levelIdx}-${nodeIdx}`}
                      ref={(el) => {
                        if (el) nodeRefs.current.set(refKey, el);
                        else nodeRefs.current.delete(refKey);
                      }}
                      type="button"
                      onClick={
                        isClickable
                          ? () => onSelectTransaction(isSelectedLeaf ? null : nodeIdx)
                          : undefined
                      }
                      disabled={!isClickable}
                      title={
                        isGhost
                          ? `${hex} (duplicate — Bitcoin hashes the last node with itself when odd)`
                          : hex
                      }
                      className={`rounded-pill border px-3 py-1.5 font-mono text-[11px] transition-all ${
                        isGhost
                          ? "border-dashed border-border bg-surface/50 text-text-muted"
                          : isRoot
                            ? "border-success/40 bg-success/10 font-bold text-success"
                            : isSelectedLeaf
                              ? "border-accent bg-accent/20 font-semibold text-accent"
                              : isInProof && isSibling
                                ? "border-teal/60 bg-teal/10 text-teal"
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
                      {isGhost && (
                        <span className="mr-1 text-[9px] italic text-text-muted">dup </span>
                      )}
                      {short}
                      {isLeaves && !isGhost && block.transactions[nodeIdx] && (
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

          <MerkleTreeConnectors
            containerRef={containerRef}
            nodeRefs={nodeRefs}
            treeEdges={treeEdges}
            proofEdgeMap={proofEdgeMap}
            maxVisibleStep={walkStep}
            hasActiveProof={hasActiveProof}
            levelCount={paddedLevels.length}
          />
        </div>

        {!hasActiveProof && block.transactions.length > 1 && (
          <p className="mt-2 text-center text-xs text-text-muted">
            Click a transaction leaf to visualize its SPV proof path
          </p>
        )}

        {hasActiveProof && merkleProof && selectedTxIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-inner border border-accent/20 bg-accent/5 px-4 py-3"
          >
            <p className="text-sm text-text-primary">
              To verify{" "}
              <strong className="text-accent">
                {block.transactions[selectedTxIndex]?.data ?? `TX-${selectedTxIndex}`}
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
