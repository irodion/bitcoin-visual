import { useState, useCallback, useRef, useEffect } from "react";
import type { HashChallengeOut } from "../../../workers/hashChallenge.worker.ts";

interface HashChallengeResult {
  nonce: number;
  hash: string;
  totalHashes: number;
  elapsedMs: number;
}

interface HashChallengeState {
  isMining: boolean;
  currentNonce: number;
  hashRate: number;
  currentHash: string;
  result: HashChallengeResult | null;
}

const IDLE: HashChallengeState = {
  isMining: false,
  currentNonce: 0,
  hashRate: 0,
  currentHash: "",
  result: null,
};

export interface UseHashChallengeReturn extends HashChallengeState {
  startChallenge: (prefix: string, difficulty: number) => void;
  stopChallenge: () => void;
}

export function useHashChallengeWorker(): UseHashChallengeReturn {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<HashChallengeState>(IDLE);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const stopChallenge = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setState(IDLE);
  }, []);

  const startChallenge = useCallback((prefix: string, difficulty: number) => {
    workerRef.current?.terminate();

    const worker = new Worker(
      new URL("../../../workers/hashChallenge.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    setState({
      isMining: true,
      currentNonce: 0,
      hashRate: 0,
      currentHash: "",
      result: null,
    });

    worker.onerror = () => {
      if (workerRef.current !== worker) return;
      setState(IDLE);
      worker.terminate();
      workerRef.current = null;
    };

    worker.onmessage = (e: MessageEvent<HashChallengeOut>) => {
      if (workerRef.current !== worker) return;
      const msg = e.data;
      if (msg.type === "progress") {
        setState((prev) => ({
          ...prev,
          currentNonce: msg.nonce,
          hashRate: msg.hashesPerSecond,
          currentHash: msg.currentHash,
        }));
      } else if (msg.type === "found") {
        setState((prev) => ({
          ...prev,
          isMining: false,
          currentNonce: msg.nonce,
          currentHash: msg.hash,
          result: {
            nonce: msg.nonce,
            hash: msg.hash,
            totalHashes: msg.totalHashes,
            elapsedMs: msg.elapsedMs,
          },
        }));
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.postMessage({ type: "start", prefix, difficulty });
  }, []);

  return { ...state, startChallenge, stopChallenge };
}
