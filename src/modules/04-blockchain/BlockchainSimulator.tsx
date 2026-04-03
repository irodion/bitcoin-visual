import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, TheoryConceptCard, TheoryCallout } from "../../shared/components/index.ts";
import { NetworkTab } from "./network/NetworkTab.tsx";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  CONTAINER_VARIANTS,
  STEP_VARIANTS,
} from "../../shared/components/styles.ts";
import { useMempoolStore } from "../../shared/stores/index.ts";
import { useBlockchainState } from "./useBlockchainState.ts";
import { Block } from "./Block.tsx";
import { MiningControls } from "./MiningControls.tsx";
import { MerkleTreePanel } from "./MerkleTreePanel.tsx";
import { BlockChainConnectors } from "./ChainLink.tsx";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

type BlockchainTabKey = "blockchain" | "network";

const TABS = [
  { key: "blockchain", label: "Blockchain" },
  { key: "network", label: "Network" },
];

function BlockchainTheory() {
  return (
    <>
      <h3>Block Structure</h3>
      <p>
        Each block contains an 80-byte header and a list of transactions. The header includes:
        version, previous block hash, Merkle root, timestamp, difficulty target, and nonce.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Hash Pointers"
          description="Each block stores the hash of the previous block's header. This creates an immutable chain — changing any block invalidates all subsequent blocks."
        />
        <TheoryConceptCard
          dot="teal"
          title="Proof of Work"
          description="Miners must find a nonce that makes the double-SHA256 of the 80-byte block header fall below a numeric target. In this demo we simplify to leading-zero counting, but the real protocol compares the full 256-bit hash against a target value."
        />
        <TheoryConceptCard
          dot="info"
          title="Difficulty Target"
          description="Each additional leading hex zero (nibble) multiplies expected work by 16. Difficulty 1 needs ~16 hashes, difficulty 4 needs ~65,536. Bitcoin adjusts difficulty every 2,016 blocks."
        />
      </div>

      <h3>Merkle Trees</h3>
      <p>
        Transactions are hashed pairwise into a binary tree. The root hash commits to all
        transactions in a single 32-byte value stored in the block header.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="success"
          title="Merkle Root"
          description="If any transaction changes, the Merkle root changes, which changes the block hash, which invalidates the block. You can't tamper with a single transaction without redoing the proof of work."
        />
        <TheoryConceptCard
          dot="warning"
          title="SPV Proofs"
          description="To prove a transaction is in a block, you only need log₂(n) hashes — the sibling at each level. This lets lightweight clients verify inclusion without downloading all transactions."
        />
      </div>

      <TheoryCallout
        label="WHY LONGER CHAINS WIN"
        title="The Nakamoto Consensus"
        description="An attacker who wants to rewrite history must redo the proof-of-work for the target block AND every block after it, while the honest network keeps extending the chain. The probability of catching up drops exponentially with each additional confirmation."
      />

      <h3>Try It</h3>
      <p>
        Edit a transaction in Block #1 and watch all subsequent blocks turn red. Mine them in order
        — just like a real blockchain reorganization.
      </p>
    </>
  );
}

function NetworkTheory() {
  return (
    <>
      <h3>P2P Network</h3>
      <p>
        Bitcoin has no central server. Nodes discover each other, share transactions via gossip, and
        converge on the same chain using proof-of-work — not by voting.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="P2P Topology"
          description="Each node makes 8 outbound connections (chosen by itself) and accepts up to 125 inbound. Outbound peers are the primary security anchor because the node chose them — but inbound peers still matter: addrman poisoning, eclipse setup, and timing attacks can all exploit inbound connections."
        />
        <TheoryConceptCard
          dot="teal"
          title="Gossip Protocol"
          description="Transactions spread via an inv/getdata dance: 'I have TX X' → 'Send it' → full TX. This avoids sending data to peers who already have it."
        />
        <TheoryConceptCard
          dot="info"
          title="Compact Blocks"
          description="BIP 152: since every node already has most transactions in its mempool, blocks are sent as 6-byte short hashes instead of full TXIDs — shrinking a ~1 MB block to ~15 KB."
        />
        <TheoryConceptCard
          dot="danger"
          title="Eclipse Attacks"
          description="An attacker who controls all 8 outbound connections can isolate a node and feed it a fake chain. Defenses include feeler connections, address bucketing, and anchor connections."
        />
        <TheoryConceptCard
          dot="success"
          title="Node Bootstrap"
          description="A new node finds peers via: saved addresses (11-second race) → DNS seeds → hardcoded IPs. Satoshi's original method decoded IRC nicknames as IP addresses."
        />
      </div>

      <TheoryCallout
        label="SYBIL RESISTANCE"
        title="Energy, Not Identity"
        description="Bitcoin counts proof-of-work, not nodes. An attacker can spin up 10,000 fake nodes and it changes nothing about which chain is valid. Identity is meaningless — only energy expenditure (hashrate) matters."
      />

      <h3>Try It</h3>
      <p>
        Click a node to broadcast a message and watch gossip propagation. Step through an eclipse
        attack, then see how compact blocks compress bandwidth.
      </p>
    </>
  );
}

const THEORY_CONTENT: Record<BlockchainTabKey, () => React.JSX.Element> = {
  blockchain: BlockchainTheory,
  network: NetworkTheory,
};

export default function BlockchainSimulator() {
  const [activeTab, setActiveTab] = useState<BlockchainTabKey>("blockchain");
  const state = useBlockchainState();
  const pendingTx = useMempoolStore((s) => s.pendingTx);
  const consumePendingTx = useMempoolStore((s) => s.consumePendingTx);
  const { completed, complete } = useModuleCompletion("blockchain");
  const initialNonces = useRef(state.blocks.map((b) => b.nonce));
  const chainContainerRef = useRef<HTMLDivElement>(null);
  const merklePanelRef = useRef<HTMLDivElement>(null);
  const chainValidity = useMemo(() => state.validity.map((v) => v.chainValid), [state.validity]);

  const handleIncludeTx = () => {
    const tx = consumePendingTx();
    if (!tx) return;
    state.addBlockWithTransactions([
      {
        id: `multisig-${tx.txidHex.slice(0, 8)}`,
        data: tx.data,
        txid: tx.txid,
        locked: true,
      },
    ]);
  };

  useEffect(() => {
    if (!completed && state.blocks.some((b, i) => b.nonce !== initialNonces.current[i])) complete();
  }, [state.blocks, completed, complete]);

  const selectedBlock =
    state.selectedBlockIndex !== null ? state.blocks[state.selectedBlockIndex] : null;

  // Scroll Merkle tree panel into view when a block is selected
  useEffect(() => {
    const el = merklePanelRef.current;
    if (!selectedBlock || !el?.scrollIntoView) return;
    const rafId = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [selectedBlock]);

  return (
    <ModuleLayout
      moduleKey="blockchain"
      title="Blockchain & Mining"
      moduleNumber={4}
      subtitle={
        activeTab === "blockchain"
          ? "Mine blocks, adjust difficulty, and explore Merkle trees — all simulated in your browser."
          : "Explore how Bitcoin nodes discover peers, propagate blocks, and defend against network attacks."
      }
      theoryContent={(() => {
        const Theory = THEORY_CONTENT[activeTab];
        return <Theory />;
      })()}
      statusText="LIVE SIMULATION"
      tabConfig={{
        tabs: TABS,
        activeTab,
        onTabChange: (key) => setActiveTab(key as BlockchainTabKey),
      }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "blockchain" && (
          <motion.div
            key="blockchain"
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mx-auto max-w-5xl space-y-6"
          >
            {/* Difficulty / Mining controls */}
            <motion.div variants={STEP_VARIANTS}>
              <MiningControls
                difficulty={state.difficulty}
                onDifficultyChange={state.setDifficulty}
                estimatedHashes={state.estimatedHashes}
                isMining={state.isMining}
                hashRate={state.hashRate}
                currentNonce={state.currentNonce}
                miningBlockIndex={state.miningBlockIndex}
              />
            </motion.div>

            {/* Pending transaction from Multisig */}
            {pendingTx && (
              <motion.div variants={STEP_VARIANTS}>
                <div className="flex items-center justify-between gap-4 rounded-card border border-accent/30 bg-surface-raised p-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-accent">
                      Pending Transaction from Multisig
                    </p>
                    <p className="truncate font-mono text-xs text-text-secondary">
                      TXID: {pendingTx.txidHex.slice(0, 24)}…
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => consumePendingTx()} className={BTN_GHOST}>
                      Dismiss
                    </button>
                    <button type="button" onClick={handleIncludeTx} className={BTN_PRIMARY}>
                      Include in New Block
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Horizontal block chain */}
            <motion.div variants={STEP_VARIANTS}>
              <div
                ref={chainContainerRef}
                className="relative flex items-start gap-6 overflow-x-auto pb-4"
              >
                {state.blocks.map((block, i) => (
                  <div key={block.index} className="shrink-0">
                    <Block
                      block={block}
                      validity={state.validity[i]}
                      isSelected={state.selectedBlockIndex === i}
                      isMining={state.isMining && state.miningBlockIndex === i}
                      miningNonce={state.currentNonce}
                      miningHashRate={state.hashRate}
                      onEditTransactionData={(txIdx, data) =>
                        state.editTransactionData(i, txIdx, data)
                      }
                      onEditNonce={(nonce) => state.editBlockNonce(i, nonce)}
                      onAddTransaction={() => state.addTransaction(i)}
                      onRemoveTransaction={(txIdx) => state.removeTransaction(i, txIdx)}
                      onMine={() => state.startMining(i)}
                      onStopMine={state.stopMining}
                      onSelect={() => state.selectBlock(i)}
                    />
                  </div>
                ))}
                <BlockChainConnectors
                  containerRef={chainContainerRef}
                  blockCount={state.blocks.length}
                  chainValidity={chainValidity}
                />
              </div>
            </motion.div>

            {/* Merkle tree panel (expanded when a block is selected) */}
            {selectedBlock && state.merkleTree && (
              <motion.div ref={merklePanelRef} variants={STEP_VARIANTS}>
                <MerkleTreePanel
                  block={selectedBlock}
                  merkleTree={state.merkleTree}
                  selectedTxIndex={state.selectedTxIndex}
                  merkleProof={state.merkleProof}
                  onSelectTransaction={state.selectTransaction}
                />
              </motion.div>
            )}
          </motion.div>
        )}
        {activeTab === "network" && (
          <motion.div
            key="network"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <NetworkTab />
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
