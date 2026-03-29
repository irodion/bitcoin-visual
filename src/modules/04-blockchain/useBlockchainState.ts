import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  buildMerkleTree,
  computeMerkleRoot,
  getMerkleProof,
  type MerkleProofStep,
} from "../../shared/crypto/merkle.ts";
import {
  type BlockData,
  type BlockValidity,
  type MockTransaction,
  DEFAULT_DIFFICULTY,
  ESTIMATED_HASHES,
  createInitialChain,
  computeBlockHash,
  serializeBlockHeader,
  txDataToTxid,
} from "./constants.ts";
import { checkHashMeetsDifficulty } from "./miningCore.ts";
import { useMiningWorker } from "./useMiningWorker.ts";

export interface BlockchainState {
  blocks: BlockData[];
  validity: BlockValidity[];
  difficulty: number;
  estimatedHashes: number;

  selectedBlockIndex: number | null;
  selectedTxIndex: number | null;

  isMining: boolean;
  miningBlockIndex: number | null;
  currentNonce: number;
  hashRate: number;

  merkleTree: Uint8Array[][] | null;
  merkleProof: MerkleProofStep[] | null;

  setDifficulty: (d: number) => void;
  editTransactionData: (blockIdx: number, txIdx: number, data: string) => void;
  editBlockNonce: (blockIdx: number, nonce: number) => void;
  addTransaction: (blockIdx: number) => void;
  removeTransaction: (blockIdx: number, txIdx: number) => void;
  addBlockWithTransactions: (transactions: MockTransaction[]) => void;
  startMining: (blockIdx: number) => void;
  stopMining: () => void;
  selectBlock: (idx: number | null) => void;
  selectTransaction: (txIdx: number | null) => void;
}

function recomputeBlock(block: BlockData): BlockData {
  const merkleRoot = computeMerkleRoot(block.transactions.map((tx) => tx.txid));
  const updated = { ...block, merkleRoot };
  return { ...updated, hash: computeBlockHash(updated) };
}

function relinkChain(blocks: BlockData[], fromIndex: number): BlockData[] {
  const result = [...blocks];
  for (let i = fromIndex; i < result.length; i++) {
    if (i > 0) {
      result[i] = { ...result[i], prevHash: result[i - 1].hash };
    }
    result[i] = recomputeBlock(result[i]);
  }
  return result;
}

export function useBlockchainState(): BlockchainState {
  const [blocks, setBlocks] = useState<BlockData[]>(() => createInitialChain(DEFAULT_DIFFICULTY));
  const [difficulty, setDifficultyRaw] = useState(DEFAULT_DIFFICULTY);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [selectedTxIndex, setSelectedTxIndex] = useState<number | null>(null);
  const txCounterRef = useRef(100);
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const applyMinedResult = useCallback((blockIdx: number, nonce: number, hash: Uint8Array) => {
    setBlocks((prev) => {
      const result = [...prev];
      result[blockIdx] = { ...result[blockIdx], nonce, hash };
      return relinkChain(result, blockIdx + 1);
    });
  }, []);

  const mining = useMiningWorker(applyMinedResult);

  const validity = useMemo<BlockValidity[]>(() => {
    return blocks.map((block, i) => {
      const hashValid = checkHashMeetsDifficulty(block.hash, difficulty);
      const chainValid =
        i === 0
          ? block.prevHash.every((b) => b === 0)
          : arraysEqual(block.prevHash, blocks[i - 1].hash);
      return { hashValid, chainValid, isValid: hashValid && chainValid };
    });
  }, [blocks, difficulty]);

  const estimatedHashes = ESTIMATED_HASHES[difficulty] ?? 0;

  const merkleTree = useMemo(() => {
    if (selectedBlockIndex === null) return null;
    const block = blocks[selectedBlockIndex];
    if (!block) return null;
    return buildMerkleTree(block.transactions.map((tx) => tx.txid));
  }, [blocks, selectedBlockIndex]);

  const merkleProof = useMemo(() => {
    if (selectedBlockIndex === null || selectedTxIndex === null || merkleTree === null) return null;
    const block = blocks[selectedBlockIndex];
    if (!block || selectedTxIndex >= block.transactions.length) return null;
    return getMerkleProof(
      block.transactions.map((tx) => tx.txid),
      selectedTxIndex,
    );
  }, [blocks, selectedBlockIndex, selectedTxIndex, merkleTree]);

  const setDifficulty = useCallback((d: number) => {
    setDifficultyRaw(d);
  }, []);

  const editTransactionData = useCallback((blockIdx: number, txIdx: number, data: string) => {
    setBlocks((prev) => {
      if (prev[blockIdx]?.transactions[txIdx]?.locked) return prev;
      const result = [...prev];
      const block = { ...result[blockIdx] };
      const transactions = [...block.transactions];
      transactions[txIdx] = {
        ...transactions[txIdx],
        data,
        txid: txDataToTxid(data),
      };
      block.transactions = transactions;
      result[blockIdx] = block;
      return relinkChain(result, blockIdx);
    });
  }, []);

  const editBlockNonce = useCallback((blockIdx: number, nonce: number) => {
    setBlocks((prev) => {
      const result = [...prev];
      const block = { ...result[blockIdx], nonce };
      result[blockIdx] = { ...block, hash: computeBlockHash(block) };
      return relinkChain(result, blockIdx + 1);
    });
  }, []);

  const addTransaction = useCallback((blockIdx: number) => {
    const txNum = txCounterRef.current++;
    setBlocks((prev) => {
      const result = [...prev];
      const block = { ...result[blockIdx] };
      const data = `New transaction #${txNum}`;
      block.transactions = [
        ...block.transactions,
        {
          id: `block${blockIdx}-tx${txNum}`,
          data,
          txid: txDataToTxid(data),
        },
      ];
      result[blockIdx] = block;
      return relinkChain(result, blockIdx);
    });
  }, []);

  const removeTransaction = useCallback((blockIdx: number, txIdx: number) => {
    setBlocks((prev) => {
      const block = prev[blockIdx];
      if (block.transactions[txIdx]?.locked) return prev;
      if (block.transactions.length <= 1) return prev;
      const result = [...prev];
      const updated = { ...block };
      updated.transactions = block.transactions.filter((_, i) => i !== txIdx);
      result[blockIdx] = updated;
      return relinkChain(result, blockIdx);
    });
  }, []);

  const addBlockWithTransactions = useCallback(
    (transactions: MockTransaction[]) => {
      setBlocks((prev) => {
        const lastBlock = prev[prev.length - 1];
        const newBlock: BlockData = {
          index: prev.length,
          version: 1,
          prevHash: lastBlock.hash,
          transactions,
          merkleRoot: new Uint8Array(32),
          timestamp: Math.floor(Date.now() / 1000),
          difficultyBits: difficulty,
          nonce: 0,
          hash: new Uint8Array(32),
        };
        return [...prev, recomputeBlock(newBlock)];
      });
    },
    [difficulty],
  );

  const miningStartFn = mining.startMining;
  const startMining = useCallback(
    (blockIdx: number) => {
      const block = blocksRef.current[blockIdx];
      if (!block) return;
      const header = serializeBlockHeader(block);
      miningStartFn(blockIdx, header, difficulty);
    },
    [difficulty, miningStartFn],
  );

  const selectBlock = useCallback((idx: number | null) => {
    setSelectedBlockIndex((prev) => (prev === idx ? null : idx));
    setSelectedTxIndex(null);
  }, []);

  const selectTransaction = useCallback((txIdx: number | null) => {
    setSelectedTxIndex((prev) => (prev === txIdx ? null : txIdx));
  }, []);

  return {
    blocks,
    validity,
    difficulty,
    estimatedHashes,
    selectedBlockIndex,
    selectedTxIndex,
    isMining: mining.isMining,
    miningBlockIndex: mining.miningBlockIndex,
    currentNonce: mining.currentNonce,
    hashRate: mining.hashRate,
    merkleTree,
    merkleProof,
    setDifficulty,
    editTransactionData,
    editBlockNonce,
    addTransaction,
    removeTransaction,
    addBlockWithTransactions,
    startMining,
    stopMining: mining.stopMining,
    selectBlock,
    selectTransaction,
  };
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
