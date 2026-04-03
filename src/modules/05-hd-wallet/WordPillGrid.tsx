interface WordPillGridProps {
  words: Array<{ word: string; index: number }>;
  /** Show BIP39 wordlist index (#1234) instead of position (1.) */
  showWordlistIndex?: boolean;
  className?: string;
}

export function WordPillGrid({ words, showWordlistIndex, className = "" }: WordPillGridProps) {
  return (
    <div className={`grid grid-cols-3 gap-2 md:grid-cols-4 ${className}`}>
      {words.map((w, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-pill border border-border bg-surface-raised px-3 py-1.5"
        >
          <span className="font-mono text-[10px] text-text-muted">
            {showWordlistIndex ? `#${w.index >= 0 ? w.index : "?"}` : `${i + 1}.`}
          </span>
          <span className="text-xs font-medium text-text-primary">{w.word}</span>
        </div>
      ))}
    </div>
  );
}
