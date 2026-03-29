interface TrackerEntry {
  cosignerId: number;
  label: string;
  signed: boolean;
}

interface SignatureTrackerProps {
  entries: TrackerEntry[];
  threshold: number;
}

export function SignatureTracker({ entries, threshold }: SignatureTrackerProps) {
  const signedCount = entries.filter((e) => e.signed).length;
  const thresholdMet = signedCount >= threshold;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {entries.map((entry) => (
          <div
            key={entry.cosignerId}
            className={`flex items-center gap-2 rounded-badge border px-3 py-1.5 text-xs font-medium transition-colors ${
              entry.signed
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-surface-raised text-text-muted"
            }`}
          >
            {entry.signed ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
            ) : (
              <span className="inline-block h-3.5 w-3.5 rounded border border-current opacity-40" />
            )}
            Cosigner {entry.cosignerId}
          </div>
        ))}
      </div>
      {thresholdMet && (
        <div className="rounded-badge border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
          Threshold met — {signedCount} of {entries.length} signatures collected
        </div>
      )}
    </div>
  );
}
