import { useState, useCallback, useRef, useEffect } from "react";
import type { WorkerOutMessage } from "../../workers/mining.worker.ts";

interface MiningState {
  isMining: boolean;
  miningBlockIndex: number | null;
  currentNonce: number;
  hashRate: number;
}

const IDLE: MiningState = {
  isMining: false,
  miningBlockIndex: null,
  currentNonce: 0,
  hashRate: 0,
};

export interface UseMiningWorkerReturn extends MiningState {
  startMining: (blockIndex: number, headerTemplate: Uint8Array, difficulty: number) => void;
  stopMining: () => void;
}

export function useMiningWorker(
  onFound: (blockIndex: number, nonce: number, hash: Uint8Array) => void,
): UseMiningWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const blockIndexRef = useRef<number | null>(null);
  const [state, setState] = useState<MiningState>(IDLE);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const stopMining = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    blockIndexRef.current = null;
    setState(IDLE);
  }, []);

  const startMining = useCallback(
    (blockIndex: number, headerTemplate: Uint8Array, difficulty: number) => {
      workerRef.current?.terminate();

      const worker = new Worker(new URL("../../workers/mining.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;
      blockIndexRef.current = blockIndex;

      setState({
        isMining: true,
        miningBlockIndex: blockIndex,
        currentNonce: 0,
        hashRate: 0,
      });

      worker.onerror = () => {
        if (workerRef.current !== worker) return;
        worker.terminate();
        workerRef.current = null;
        blockIndexRef.current = null;
        setState(IDLE);
      };

      worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
        if (workerRef.current !== worker) return;
        const msg = e.data;
        if (msg.type === "progress") {
          setState((prev) => ({
            ...prev,
            currentNonce: msg.nonce,
            hashRate: msg.hashesPerSecond,
          }));
        } else if (msg.type === "found") {
          const idx = blockIndexRef.current;
          if (idx !== null) {
            onFound(idx, msg.nonce, new Uint8Array(msg.hash));
          }
          worker.terminate();
          workerRef.current = null;
          blockIndexRef.current = null;
          setState(IDLE);
        } else if (msg.type === "exhausted") {
          worker.terminate();
          workerRef.current = null;
          blockIndexRef.current = null;
          setState(IDLE);
        }
      };

      worker.postMessage({
        type: "start",
        headerTemplate: headerTemplate.buffer.slice(
          headerTemplate.byteOffset,
          headerTemplate.byteOffset + headerTemplate.byteLength,
        ),
        difficulty,
        startNonce: 0,
      });
    },
    [onFound],
  );

  return { ...state, startMining, stopMining };
}
