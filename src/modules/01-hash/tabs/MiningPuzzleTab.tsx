import { useState, useRef, useEffect } from "react";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  INPUT,
  LABEL,
  SECTION_LABEL,
} from "../../../shared/components/styles.ts";
import { useHashChallengeWorker } from "../hooks/useHashChallengeWorker.ts";
import { MiningDashboard } from "../components/MiningDashboard.tsx";
import { BITCOIN_HASHRATE, formatScale } from "../miningUtils.ts";
import type { HashChallengeOut } from "../../../workers/hashChallenge.worker.ts";

const DIFFICULTIES = [
  { value: 1, label: "1 zero", tag: "easy" },
  { value: 2, label: "2 zeros", tag: "medium" },
  { value: 3, label: "3 zeros", tag: "hard" },
  { value: 4, label: "4 zeros", tag: "extreme" },
];

interface MiningPuzzleTabProps {
  onInteract: () => void;
}

export function MiningPuzzleTab({ onInteract }: MiningPuzzleTabProps) {
  const [prefix, setPrefix] = useState("Hello, Bitcoin!");
  const [difficulty, setDifficulty] = useState(1);
  const [benchmarkResult, setBenchmarkResult] = useState<number | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const benchWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      benchWorkerRef.current?.terminate();
      benchWorkerRef.current = null;
    };
  }, []);

  const challenge = useHashChallengeWorker();

  function handleMine() {
    onInteract();
    challenge.startChallenge(prefix, difficulty);
  }

  function handleBenchmark() {
    onInteract();
    setBenchmarking(true);
    setBenchmarkResult(null);

    benchWorkerRef.current?.terminate();
    const worker = new Worker(
      new URL("../../../workers/hashChallenge.worker.ts", import.meta.url),
      { type: "module" },
    );
    benchWorkerRef.current = worker;

    worker.onmessage = (e: MessageEvent<HashChallengeOut>) => {
      if (benchWorkerRef.current !== worker) return;
      if (e.data.type === "benchmark-result") {
        setBenchmarkResult(e.data.hashesPerSecond);
        setBenchmarking(false);
        worker.terminate();
        benchWorkerRef.current = null;
      }
    };

    worker.onerror = () => {
      if (benchWorkerRef.current !== worker) return;
      setBenchmarking(false);
      worker.terminate();
      benchWorkerRef.current = null;
    };

    worker.postMessage({ type: "benchmark" });
  }

  return (
    <div className="space-y-6">
      {/* ── Mining Challenge ── */}
      <section>
        <div className={SECTION_LABEL}>Mining Challenge</div>

        <div className="mt-2 rounded-section border border-border bg-surface p-5 md:p-6">
          <p className="mb-4 text-sm text-text-secondary">
            Find a nonce such that SHA-256(message + nonce) starts with the required leading zeros.
            Each extra zero makes the puzzle ~16× harder.
          </p>

          <label htmlFor="mining-prefix" className={LABEL}>
            Message Prefix
          </label>
          <input
            id="mining-prefix"
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className={INPUT}
            disabled={challenge.isMining}
          />

          <div className="mt-4">
            <div className={LABEL}>Difficulty</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  disabled={challenge.isMining}
                  className={difficulty === d.value ? BTN_PRIMARY : BTN_GHOST}
                >
                  {d.label}
                  <span className="ml-1 text-xs opacity-60">({d.tag})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            {!challenge.isMining ? (
              <button type="button" onClick={handleMine} className={BTN_PRIMARY}>
                Mine!
              </button>
            ) : (
              <button type="button" onClick={challenge.stopChallenge} className={BTN_GHOST}>
                Stop
              </button>
            )}
          </div>
        </div>
      </section>

      <MiningDashboard
        currentNonce={challenge.currentNonce}
        hashRate={challenge.hashRate}
        currentHash={challenge.currentHash}
        isMining={challenge.isMining}
        result={challenge.result}
      />

      {/* ── Benchmark ── */}
      <section>
        <div className={SECTION_LABEL}>Speed Benchmark</div>

        <div className="mt-2 rounded-section border border-border bg-surface p-5 md:p-6">
          <p className="mb-4 text-sm text-text-secondary">
            How fast can your browser compute SHA-256? Click to run a 1-second benchmark.
          </p>

          <button
            type="button"
            onClick={handleBenchmark}
            disabled={benchmarking}
            className={BTN_PRIMARY}
          >
            {benchmarking ? "Running…" : "Benchmark"}
          </button>

          {benchmarkResult !== null && (
            <div className="mt-4 rounded-inner border border-border bg-[#0E1521] p-4 text-sm">
              <p className="text-text-primary">
                Your browser:{" "}
                <strong className="font-mono text-accent">
                  {benchmarkResult.toLocaleString()} SHA-256/sec
                </strong>
              </p>
              <p className="mt-1 text-text-secondary">
                Bitcoin network: <strong className="text-text-primary">~600 EH/s</strong> — that is{" "}
                <strong className="text-accent">
                  {benchmarkResult > 0
                    ? `${formatScale(BITCOIN_HASHRATE / benchmarkResult)}×`
                    : "—"}
                </strong>{" "}
                faster
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
