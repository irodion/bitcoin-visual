import { useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { MODULES } from "../constants/modules.ts";
import { useProgressStore } from "../stores/index.ts";

interface SidebarProps {
  currentModuleKey: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const SIDEBAR_VARIANTS: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

const BACKDROP_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function SidebarContent({
  currentModuleKey,
  onClose,
}: {
  currentModuleKey: string;
  onClose?: () => void;
}) {
  const completedModules = useProgressStore((s) => s.completedModules);

  return (
    <nav
      className="flex h-full w-14 flex-col items-center gap-1 border-r border-border py-3 panel-cool"
      aria-label="Module navigation"
    >
      {onClose && (
        <button
          type="button"
          className="mb-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
          autoFocus
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}

      <Link
        to="/"
        className="mb-1 flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
        aria-label="Home"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5 8 2l6 4.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
          <path d="M6 14V9h4v5" />
        </svg>
      </Link>

      <div className="mx-2 mb-1 h-px w-6 bg-border" />

      {MODULES.map((mod) => {
        const isCurrent = mod.key === currentModuleKey;
        const isCompleted = completedModules.includes(mod.key);
        const ariaLabel = mod.active
          ? isCompleted
            ? `${mod.title}, completed`
            : mod.title
          : `${mod.title} (coming soon)`;

        return (
          <div key={mod.key} className="group/nav relative">
            {mod.active ? (
              <Link
                to={mod.route}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCurrent ? "ring-2 ring-accent/40" : "hover:scale-110"
                }`}
                style={{
                  background: isCurrent ? `${mod.color}28` : `${mod.color}12`,
                  color: mod.color,
                }}
                aria-label={ariaLabel}
                aria-current={isCurrent ? "page" : undefined}
              >
                {mod.number}
                {isCompleted && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-success text-white"
                    aria-hidden="true"
                  >
                    <svg
                      width="7"
                      height="7"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 5.5 4 7.5 8 3" />
                    </svg>
                  </span>
                )}
              </Link>
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold opacity-30"
                style={{ background: `${mod.color}12`, color: mod.color }}
                aria-label={ariaLabel}
              >
                {mod.number}
              </span>
            )}

            <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-badge border border-border-strong bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-primary shadow-lg group-hover/nav:md:block">
              {mod.title}
              {!mod.active && <span className="ml-1.5 text-text-muted">(soon)</span>}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ currentModuleKey, mobileOpen, onMobileClose }: SidebarProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    },
    [onMobileClose],
  );

  useEffect(() => {
    if (!mobileOpen) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, handleEscape]);

  return (
    <>
      <div className="hidden shrink-0 md:block">
        <SidebarContent currentModuleKey={currentModuleKey} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              variants={BACKDROP_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.div
              ref={drawerRef}
              className="fixed left-0 top-0 z-50 h-full md:hidden"
              variants={SIDEBAR_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Module navigation"
            >
              <SidebarContent currentModuleKey={currentModuleKey} onClose={onMobileClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
