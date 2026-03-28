import { sha256 } from "@noble/hashes/sha2.js";
import { checkHashMeetsDifficulty } from "../modules/04-blockchain/miningCore.ts";

export interface MineRequest {
  type: "start";
  headerTemplate: ArrayBuffer;
  difficulty: number;
  startNonce: number;
}

export interface MineProgress {
  type: "progress";
  nonce: number;
  hashesPerSecond: number;
}

export interface MineResult {
  type: "found";
  nonce: number;
  hash: ArrayBuffer;
  totalHashes: number;
}

export type WorkerOutMessage = MineProgress | MineResult;

const BATCH_SIZE = 2_000;

self.onmessage = (e: MessageEvent<MineRequest | { type: "stop" }>) => {
  if (e.data.type === "stop") return;

  const { headerTemplate, difficulty, startNonce } = e.data as MineRequest;
  const header = new Uint8Array(headerTemplate);

  let nonce = startNonce;
  let lastReport = performance.now();
  let hashCount = 0;

  while (nonce <= 0xffffffff) {
    // Write nonce at offset 76 (little-endian uint32)
    header[76] = nonce & 0xff;
    header[77] = (nonce >>> 8) & 0xff;
    header[78] = (nonce >>> 16) & 0xff;
    header[79] = (nonce >>> 24) & 0xff;

    // sha256d = sha256(sha256(data))
    const hash = sha256(sha256(header));
    hashCount++;

    if (checkHashMeetsDifficulty(hash, difficulty)) {
      const hashCopy = new ArrayBuffer(hash.byteLength);
      new Uint8Array(hashCopy).set(hash);
      const msg: MineResult = {
        type: "found",
        nonce,
        hash: hashCopy,
        totalHashes: hashCount,
      };
      self.postMessage(msg);
      return;
    }

    if (hashCount % BATCH_SIZE === 0) {
      const now = performance.now();
      const elapsed = (now - lastReport) / 1_000;
      const msg: MineProgress = {
        type: "progress",
        nonce,
        hashesPerSecond: elapsed > 0 ? Math.round(BATCH_SIZE / elapsed) : 0,
      };
      self.postMessage(msg);
      lastReport = now;
    }

    nonce++;
  }
};
