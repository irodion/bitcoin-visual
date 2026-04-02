import { useMemo } from "react";

interface BitGridProps {
  original: Uint8Array;
  modified: Uint8Array;
  diffCount: number;
}

export function BitGrid({ original, modified, diffCount }: BitGridProps) {
  const bits = useMemo(() => {
    const result: boolean[] = [];
    for (let i = 0; i < original.length; i++) {
      const xor = original[i] ^ modified[i];
      for (let bit = 7; bit >= 0; bit--) {
        result.push(((xor >> bit) & 1) === 1);
      }
    }
    return result;
  }, [original, modified]);

  const pct = ((diffCount / 256) * 100).toFixed(1);

  return (
    <div>
      <div
        className="grid grid-cols-[repeat(64,1fr)] gap-[1px]"
        role="img"
        aria-label={`Bit grid: ${diffCount} of 256 bits differ (${pct}%)`}
      >
        {bits.map((flipped, i) => (
          <div
            key={i}
            className={`h-2 rounded-[2px] transition-[filter] duration-150 hover:brightness-125 ${
              flipped ? "bg-danger shadow-[0_0_3px_rgba(255,107,107,0.3)]" : "bg-teal/60"
            }`}
            title={`Bit ${i}: ${flipped ? "flipped" : "same"}`}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-text-secondary">
        {diffCount} of 256 bits flipped ({pct}%) — ideal avalanche ≈ 50%
      </p>
    </div>
  );
}
