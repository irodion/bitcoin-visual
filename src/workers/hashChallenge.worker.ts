import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export interface HashChallengeRequest {
  type: "start";
  prefix: string;
  difficulty: number;
}

export interface HashBenchmarkRequest {
  type: "benchmark";
}

export interface HashChallengeProgress {
  type: "progress";
  nonce: number;
  hashesPerSecond: number;
  currentHash: string;
}

export interface HashChallengeFound {
  type: "found";
  nonce: number;
  hash: string;
  totalHashes: number;
  elapsedMs: number;
}

export interface HashBenchmarkResult {
  type: "benchmark-result";
  hashesPerSecond: number;
}

export type HashChallengeOut = HashChallengeProgress | HashChallengeFound | HashBenchmarkResult;

const BATCH_SIZE = 2_000;
const encoder = new TextEncoder();

/** Check leading zero nibbles directly on bytes — avoids hex allocation per hash */
function hasLeadingZeroNibbles(hash: Uint8Array, difficulty: number): boolean {
  for (let i = 0; i < difficulty; i++) {
    const byteIndex = i >>> 1;
    const nibble = i & 1 ? hash[byteIndex] & 0x0f : hash[byteIndex] >>> 4;
    if (nibble !== 0) return false;
  }
  return true;
}

function runBenchmark() {
  const start = performance.now();
  let count = 0;
  while (performance.now() - start < 1000) {
    sha256(encoder.encode(`bench-${count}`));
    count++;
  }
  const msg: HashBenchmarkResult = { type: "benchmark-result", hashesPerSecond: count };
  self.postMessage(msg);
}

function runMiningChallenge(prefix: string, difficulty: number) {
  const startTime = performance.now();

  let nonce = 0;
  let lastReport = performance.now();
  let hashCount = 0;
  let latestHex = "";

  while (nonce <= 0xffffffff) {
    const input = encoder.encode(prefix + nonce.toString());
    const hash = sha256(input);
    hashCount++;

    if (hasLeadingZeroNibbles(hash, difficulty)) {
      latestHex = bytesToHex(hash);
      const msg: HashChallengeFound = {
        type: "found",
        nonce,
        hash: latestHex,
        totalHashes: hashCount,
        elapsedMs: performance.now() - startTime,
      };
      self.postMessage(msg);
      return;
    }

    if (hashCount % BATCH_SIZE === 0) {
      latestHex = bytesToHex(hash);
      const now = performance.now();
      const elapsed = (now - lastReport) / 1_000;
      const msg: HashChallengeProgress = {
        type: "progress",
        nonce,
        hashesPerSecond: elapsed > 0 ? Math.round(BATCH_SIZE / elapsed) : 0,
        currentHash: latestHex,
      };
      self.postMessage(msg);
      lastReport = now;
    }

    nonce++;
  }
}

self.onmessage = (e: MessageEvent<HashChallengeRequest | HashBenchmarkRequest>) => {
  if (e.data.type === "benchmark") {
    runBenchmark();
  } else if (e.data.type === "start") {
    runMiningChallenge(e.data.prefix, e.data.difficulty);
  }
};
