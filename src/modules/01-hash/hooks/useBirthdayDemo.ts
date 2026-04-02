import { useState, useCallback, useRef } from "react";
import { sha256 } from "../../../shared/crypto/index.ts";

const encoder = new TextEncoder();

function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[values[i] % chars.length];
  }
  return result;
}

function truncateHash(hash: Uint8Array, bits: 8 | 16): number {
  if (bits === 8) return hash[0];
  return (hash[0] << 8) | hash[1];
}

export interface BirthdayEntry {
  input: string;
  hash: number;
}

export interface BirthdayCollision {
  a: string;
  b: string;
  hash: number;
}

interface ProcessResult {
  entry: BirthdayEntry;
  collision: BirthdayCollision | null;
}

export interface UseBirthdayDemoReturn {
  hashBits: 8 | 16;
  entries: BirthdayEntry[];
  collision: BirthdayCollision | null;
  setHashBits: (bits: 8 | 16) => void;
  addOne: () => void;
  addBatch: (n: number) => void;
  reset: () => void;
}

export function useBirthdayDemo(): UseBirthdayDemoReturn {
  const [hashBits, setHashBitsState] = useState<8 | 16>(8);
  const [entries, setEntries] = useState<BirthdayEntry[]>([]);
  const [collision, setCollision] = useState<BirthdayCollision | null>(null);
  const seenMap = useRef<Map<number, string>>(new Map());

  function processEntry(bits: 8 | 16): ProcessResult {
    const input = randomString(4);
    const hash = sha256(encoder.encode(input));
    const truncated = truncateHash(hash, bits);
    const entry: BirthdayEntry = { input, hash: truncated };

    const existing = seenMap.current.get(truncated);
    if (existing !== undefined) {
      return { entry, collision: { a: existing, b: input, hash: truncated } };
    }
    seenMap.current.set(truncated, input);
    return { entry, collision: null };
  }

  const addOne = useCallback(() => {
    if (collision) return;
    const result = processEntry(hashBits);
    setEntries((prev) => [...prev, result.entry]);
    if (result.collision) setCollision(result.collision);
  }, [hashBits, collision]);

  const addBatch = useCallback(
    (n: number) => {
      if (collision) return;
      const newEntries: BirthdayEntry[] = [];
      let found: BirthdayCollision | null = null;

      for (let i = 0; i < n && !found; i++) {
        const result = processEntry(hashBits);
        newEntries.push(result.entry);
        if (result.collision) found = result.collision;
      }

      setEntries((prev) => [...prev, ...newEntries]);
      if (found) setCollision(found);
    },
    [hashBits, collision],
  );

  const reset = useCallback(() => {
    setEntries([]);
    setCollision(null);
    seenMap.current.clear();
  }, []);

  const setHashBits = useCallback((bits: 8 | 16) => {
    setHashBitsState(bits);
    setEntries([]);
    setCollision(null);
    seenMap.current.clear();
  }, []);

  return { hashBits, entries, collision, setHashBits, addOne, addBatch, reset };
}
