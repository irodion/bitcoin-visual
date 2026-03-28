import { MIN_DIFFICULTY, MAX_DIFFICULTY } from "./constants.ts";

interface MiningControlsProps {
  difficulty: number;
  onDifficultyChange: (d: number) => void;
  estimatedHashes: number;
  isMining: boolean;
  hashRate: number;
  currentNonce: number;
  miningBlockIndex: number | null;
}

export function MiningControls({
  difficulty,
  onDifficultyChange,
  estimatedHashes,
  isMining,
  hashRate,
  currentNonce,
  miningBlockIndex,
}: MiningControlsProps) {
  const zeros = "0".repeat(difficulty);

  return (
    <div className="rounded-card border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Difficulty slider */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="difficulty-slider"
            className="text-[11px] font-medium uppercase tracking-widest text-text-secondary"
          >
            Difficulty
          </label>
          <input
            id="difficulty-slider"
            type="range"
            min={MIN_DIFFICULTY}
            max={MAX_DIFFICULTY}
            value={difficulty}
            onChange={(e) => onDifficultyChange(Number(e.target.value))}
            disabled={isMining}
            className="w-32 cursor-pointer accent-accent disabled:opacity-50"
          />
          <span className="text-2xl font-bold text-accent">{difficulty}</span>
        </div>

        {/* Target preview */}
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <span>
            Hash must start with: <code className="font-mono font-bold text-accent">{zeros}</code>
          </span>
          <span className="hidden text-xs md:inline">
            ~{estimatedHashes.toLocaleString()} hashes expected
          </span>
        </div>
      </div>

      {/* Mining status */}
      {isMining && miningBlockIndex !== null && (
        <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span>Mining Block #{miningBlockIndex}</span>
          <span className="font-mono">Nonce: {currentNonce.toLocaleString()}</span>
          {hashRate > 0 && (
            <span className="ml-auto font-mono text-accent">{hashRate.toLocaleString()} H/s</span>
          )}
        </div>
      )}
    </div>
  );
}
