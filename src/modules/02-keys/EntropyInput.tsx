import { BTN_PRIMARY, INPUT, LABEL } from "../../shared/components/styles.ts";

interface EntropyInputProps {
  value: string;
  onChange: (hex: string) => void;
  onGenerate: () => void;
  error: string | null;
}

export function EntropyInput({ value, onChange, onGenerate, error }: EntropyInputProps) {
  return (
    <div className="panel-cool rounded-[30px] border border-border p-6">
      <h3 className="mb-1 text-lg font-bold text-text-primary">Entropy Source</h3>
      <p className="mb-4 text-sm text-text-muted">Generate or paste 32 random bytes</p>

      <button type="button" onClick={onGenerate} className={BTN_PRIMARY}>
        Generate Random Key
      </button>

      <div className="mt-4">
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
        {value.length > 0 && (
          <div className="mt-2 flex gap-2">
            <span className="rounded-pill bg-[#171E2C] px-3 py-1 text-xs font-bold text-text-primary">
              {value.length} / 64 chars
            </span>
            <span className="rounded-pill bg-[#171E2C] px-3 py-1 text-xs font-bold text-text-primary">
              {(value.match(/[0-9a-fA-F]{2}/g) ?? []).length} / 32 bytes
            </span>
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-danger" role="status">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
