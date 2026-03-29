import { sha256d } from "../../shared/crypto/index.ts";
import { computeMerkleRoot } from "../../shared/crypto/merkle.ts";
import { checkHashMeetsDifficulty } from "./miningCore.ts";

/* ── Interfaces ─────────────────────────────────────────────────── */

export interface MockTransaction {
  id: string;
  data: string;
  txid: Uint8Array;
  locked?: boolean;
}

export interface BlockData {
  index: number;
  version: number;
  prevHash: Uint8Array;
  transactions: MockTransaction[];
  merkleRoot: Uint8Array;
  timestamp: number;
  difficultyBits: number;
  nonce: number;
  hash: Uint8Array;
}

export interface BlockValidity {
  hashValid: boolean;
  chainValid: boolean;
  isValid: boolean;
}

/* ── Constants ──────────────────────────────────────────────────── */

export const DEFAULT_DIFFICULTY = 2;
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

export const ESTIMATED_HASHES: Record<number, number> = {
  1: 16,
  2: 256,
  3: 4_096,
  4: 65_536,
  5: 1_048_576,
};

const INITIAL_TRANSACTIONS: string[][] = [
  ["Alice pays Bob 0.5 BTC", "Bob pays Carol 0.3 BTC", "Coinbase reward 6.25 BTC"],
  ["Carol pays Dave 0.1 BTC", "Dave pays Eve 0.2 BTC", "Coinbase reward 6.25 BTC"],
  ["Eve pays Frank 0.05 BTC", "Frank pays Grace 0.4 BTC", "Coinbase reward 6.25 BTC"],
];

/* ── Helpers ────────────────────────────────────────────────────── */

const encoder = new TextEncoder();

export function txDataToTxid(data: string): Uint8Array {
  return sha256d(encoder.encode(data));
}

function writeUint32LE(buf: Uint8Array, value: number, offset: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}

/**
 * Serialize an 80-byte block header matching real Bitcoin layout:
 * [version(4) | prevHash(32) | merkleRoot(32) | timestamp(4) | difficulty(4) | nonce(4)]
 */
export function serializeBlockHeader(block: BlockData): Uint8Array {
  const header = new Uint8Array(80);
  writeUint32LE(header, block.version, 0);
  header.set(block.prevHash, 4);
  header.set(block.merkleRoot, 36);
  writeUint32LE(header, block.timestamp, 68);
  writeUint32LE(header, block.difficultyBits, 72);
  writeUint32LE(header, block.nonce, 76);
  return header;
}

export function computeBlockHash(block: BlockData): Uint8Array {
  return sha256d(serializeBlockHeader(block));
}

function buildTransactions(blockIndex: number, descriptions: string[]): MockTransaction[] {
  return descriptions.map((data, i) => ({
    id: `block${blockIndex}-tx${i}`,
    data,
    txid: txDataToTxid(data),
  }));
}

/**
 * Brute-force a nonce that makes the block hash meet difficulty.
 * At difficulty 2 this takes ~256 hashes on average (<1ms).
 */
function mineBlock(block: BlockData): BlockData {
  for (let nonce = 0; nonce <= 0xffffffff; nonce++) {
    const candidate = { ...block, nonce };
    const hash = computeBlockHash(candidate);
    if (checkHashMeetsDifficulty(hash, block.difficultyBits)) {
      return { ...candidate, hash };
    }
  }
  return block; // unreachable for reasonable difficulty
}

/**
 * Create the initial chain of 3 pre-mined blocks.
 * Runs synchronously — fast at low difficulty.
 */
export function createInitialChain(difficulty: number): BlockData[] {
  const blocks: BlockData[] = [];
  const baseTimestamp = 1_700_000_000; // fixed for deterministic display

  for (let i = 0; i < INITIAL_TRANSACTIONS.length; i++) {
    const transactions = buildTransactions(i, INITIAL_TRANSACTIONS[i]);
    const merkleRoot = computeMerkleRoot(transactions.map((tx) => tx.txid));
    const prevHash = i === 0 ? new Uint8Array(32) : blocks[i - 1].hash;

    const block: BlockData = {
      index: i,
      version: 1,
      prevHash,
      transactions,
      merkleRoot,
      timestamp: baseTimestamp + i * 600,
      difficultyBits: difficulty,
      nonce: 0,
      hash: new Uint8Array(32),
    };

    blocks.push(mineBlock(block));
  }

  return blocks;
}
