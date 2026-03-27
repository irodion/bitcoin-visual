const BTN_ACCENT =
  "cursor-pointer rounded-card border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20";
const LABEL = "mb-2 block text-[11px] font-medium uppercase tracking-widest text-text-secondary";
const INPUT =
  "w-full rounded-input border border-border bg-surface-raised px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none";

interface EntropyInputProps {
  value: string;
  onChange: (hex: string) => void;
  onGenerate: () => void;
  error: string | null;
}

export function EntropyInput({ value, onChange, onGenerate, error }: EntropyInputProps) {
  return (
    <div className="space-y-3">
      <button type="button" onClick={onGenerate} className={BTN_ACCENT}>
        Generate Random Key
      </button>

      <div>
        <label htmlFor="entropy-input" className={LABEL}>
          Or paste custom entropy (64 hex characters)
        </label>
        <input
          id="entropy-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter 64 hex characters (32 bytes)..."
          maxLength={64}
          spellCheck={false}
          autoComplete="off"
          className={INPUT}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger" role="status">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
