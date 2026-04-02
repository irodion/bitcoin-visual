import { useMemo, useState, useEffect, useRef } from "react";
import { BTN_PRIMARY, BTN_GHOST } from "../../../shared/components/styles.ts";
import type { BirthdayEntry, BirthdayCollision } from "../hooks/useBirthdayDemo.ts";

interface CollisionBucketVizProps {
  hashBits: 8 | 16;
  entries: BirthdayEntry[];
  collision: BirthdayCollision | null;
  addOne: () => void;
  addBatch: (n: number) => void;
  reset: () => void;
}

export function CollisionBucketViz({
  hashBits,
  entries,
  collision,
  addOne,
  addBatch,
  reset,
}: CollisionBucketVizProps) {
  const [autoRun, setAutoRun] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addOneRef = useRef(addOne);
  addOneRef.current = addOne;

  useEffect(() => {
    if (collision) {
      setAutoRun(false);
    }
  }, [collision]);

  useEffect(() => {
    if (autoRun && !collision) {
      intervalRef.current = setInterval(() => addOneRef.current(), 80);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRun, collision]);

  const totalSlots = 1 << hashBits;
  const expected50 = Math.round(Math.sqrt(2 * Math.log(2) * totalSlots));

  const bucketCountsArray = useMemo(() => {
    if (hashBits !== 8) return null;
    const counts = new Uint16Array(256);
    for (const entry of entries) {
      counts[entry.hash]++;
    }
    return Array.from(counts);
  }, [entries, hashBits]);

  const slotsFilled = useMemo(() => {
    if (hashBits !== 16) return 0;
    const seen = new Set<number>();
    for (const entry of entries) {
      seen.add(entry.hash);
    }
    return seen.size;
  }, [entries, hashBits]);

  return (
    <div className="space-y-4">
      {/* 8-bit bucket grid */}
      {hashBits === 8 && bucketCountsArray && (
        <div
          className="grid grid-cols-[repeat(64,1fr)] gap-[1px]"
          role="img"
          aria-label={`Birthday paradox bucket grid: ${entries.length} hashes generated, ${collision ? "collision found" : "no collision yet"}`}
        >
          {bucketCountsArray.map((count, i) => (
            <div
              key={i}
              className={`h-2 rounded-[2px] transition-colors duration-150 ${
                count === 0
                  ? "bg-surface"
                  : count === 1
                    ? "bg-teal/40"
                    : "bg-danger shadow-[0_0_4px_rgba(255,107,107,0.4)]"
              }`}
              title={`Bucket ${i}: ${count} ${count === 1 ? "entry" : "entries"}`}
            />
          ))}
        </div>
      )}

      {/* 16-bit progress bar */}
      {hashBits === 16 && (
        <div>
          <div className="mb-1 text-xs text-text-secondary">
            Slots filled: {slotsFilled.toLocaleString()} of {totalSlots.toLocaleString()}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#131C2A]">
            <div
              className={`h-full transition-all duration-150 ${collision ? "bg-danger" : "bg-teal"}`}
              style={{ width: `${(slotsFilled / totalSlots) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            Generated
          </div>
          <div className="font-mono text-lg text-text-primary">{entries.length}</div>
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            Expected (50%)
          </div>
          <div className="font-mono text-lg text-text-muted">~{expected50}</div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            Status
          </div>
          <div className={`font-mono text-lg ${collision ? "text-danger" : "text-text-muted"}`}>
            {collision ? `Collision at attempt ${entries.length}!` : "No collision yet"}
          </div>
        </div>
      </div>

      {/* Collision detail */}
      {collision && (
        <div className="rounded-inner border border-danger/30 bg-danger/5 p-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-danger">
            Collision Found
          </div>
          <p className="mt-1 text-sm text-text-primary">
            "<strong className="font-mono">{collision.a}</strong>" and "
            <strong className="font-mono">{collision.b}</strong>" both hash to{" "}
            <strong className="font-mono text-danger">
              {collision.hash.toString(16).padStart(hashBits / 4, "0")}
            </strong>
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addOne} disabled={!!collision} className={BTN_GHOST}>
          Add 1
        </button>
        <button
          type="button"
          onClick={() => addBatch(10)}
          disabled={!!collision}
          className={BTN_GHOST}
        >
          Add 10
        </button>
        <button
          type="button"
          onClick={() => setAutoRun((r) => !r)}
          disabled={!!collision}
          className={autoRun ? BTN_PRIMARY : BTN_GHOST}
        >
          {autoRun ? "⏸ Pause" : "▶ Auto-run"}
        </button>
        <button type="button" onClick={reset} className={BTN_GHOST}>
          Reset
        </button>
      </div>
    </div>
  );
}
