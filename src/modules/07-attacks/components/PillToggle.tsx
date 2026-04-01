import { useRef, useEffect } from "react";

interface PillToggleOption<T extends string> {
  key: T;
  label: string;
}

interface PillToggleProps<T extends string> {
  options: readonly PillToggleOption<T>[];
  value: T;
  onChange: (key: T) => void;
  label: string;
}

export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: PillToggleProps<T>) {
  const refs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const keyboardNav = useRef(false);

  useEffect(() => {
    if (keyboardNav.current) {
      refs.current.get(value)?.focus();
      keyboardNav.current = false;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keys = options.map((o) => o.key);
    const idx = keys.indexOf(value);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      keyboardNav.current = true;
      onChange(keys[(idx + 1) % keys.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      keyboardNav.current = true;
      onChange(keys[(idx - 1 + keys.length) % keys.length]);
    }
  };

  return (
    <div
      className="flex rounded-pill border border-border bg-surface-raised p-0.5"
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            ref={(el) => {
              if (el) refs.current.set(opt.key, el);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.key)}
            className={`cursor-pointer rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors ${
              selected
                ? "bg-accent text-text-on-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
