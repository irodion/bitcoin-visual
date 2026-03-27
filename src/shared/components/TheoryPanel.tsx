import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";

interface TheoryPanelProps {
  moduleKey: string;
  children: ReactNode;
  className?: string;
}

function getStorageKey(moduleKey: string) {
  return `theory-panel-${moduleKey}`;
}

function readPersistedState(moduleKey: string): boolean {
  try {
    const stored = localStorage.getItem(getStorageKey(moduleKey));
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function TheoryPanel({ moduleKey, children, className = "" }: TheoryPanelProps) {
  const [isOpen, setIsOpen] = useState(() => readPersistedState(moduleKey));

  useEffect(() => {
    setIsOpen(readPersistedState(moduleKey));
  }, [moduleKey]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(getStorageKey(moduleKey), String(next));
      } catch {
        /* storage full or unavailable */
      }
      return next;
    });
  }, [moduleKey]);

  return (
    <div className={`relative flex shrink-0 ${className}`}>
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 320 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden border-r border-border bg-surface"
      >
        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: isOpen ? 0.3 : 0.15, delay: isOpen ? 0.1 : 0 }}
          className="w-[320px] overflow-y-auto p-5"
          style={{ maxHeight: "calc(100vh - 52px)" }}
        >
          <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M2 3h12M2 7h8M2 11h10M2 15h6" />
            </svg>
            Theory
          </div>
          <div className="text-sm leading-relaxed text-text-secondary [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-text-primary [&_p]:mb-3 [&_strong]:font-medium [&_strong]:text-text-primary [&_code]:rounded [&_code]:bg-surface-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-accent">
            {children}
          </div>
        </motion.div>
      </motion.div>

      <button
        type="button"
        onClick={toggle}
        className="absolute -right-4 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-md transition-all hover:border-border-strong hover:text-accent active:scale-90"
        aria-label={isOpen ? "Collapse theory panel" : "Expand theory panel"}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}
        >
          <path d="M9 3 5 7l4 4" />
        </svg>
      </button>
    </div>
  );
}
