import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageBackground, ConfirmDialog } from "../shared/components/index.ts";
import { useThemeStore, useProgressStore } from "../shared/stores/index.ts";
import { usePWAInstall } from "../shared/hooks/usePWAInstall.ts";
import { MODULES } from "../shared/constants/modules.ts";
import { BTN_PRIMARY, BTN_GHOST } from "../shared/components/styles.ts";

const SECTION = "rounded-card border border-border bg-surface-raised p-6";

const SECTION_TITLE = "mb-1 text-base font-bold text-text-primary";

const SECTION_DESC = "mb-4 text-sm text-text-secondary";

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isLight = theme === "light";

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>Appearance</h2>
      <p className={SECTION_DESC}>Switch between dark and light mode.</p>
      <div className="flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors ${isLight ? "text-text-muted" : "text-accent"}`}
          aria-hidden="true"
        >
          <path d="M13.6 8.8A6 6 0 1 1 7.2 2.4a4.5 4.5 0 0 0 6.4 6.4Z" />
        </svg>

        <button
          type="button"
          role="switch"
          aria-checked={isLight}
          aria-label="Toggle light mode"
          className="relative h-7 w-12 cursor-pointer rounded-full border border-border bg-input-bg transition-colors"
          onClick={toggleTheme}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-accent transition-transform ${
              isLight ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>

        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors ${isLight ? "text-accent" : "text-text-muted"}`}
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
        </svg>
      </div>
    </section>
  );
}

function LearningProgress() {
  const completedModules = useProgressStore((s) => s.completedModules);
  const reset = useProgressStore((s) => s.reset);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = useCallback(() => {
    reset();
    setConfirmOpen(false);
  }, [reset]);

  const handleCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>Learning Progress</h2>
      <p className={SECTION_DESC}>
        {completedModules.length} of {MODULES.length} modules completed.
      </p>
      <button
        type="button"
        className={`${BTN_GHOST} text-danger hover:text-danger`}
        onClick={() => setConfirmOpen(true)}
        disabled={completedModules.length === 0}
      >
        Clear Progress
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Clear All Progress?"
        description="This will reset your completion status for all modules. Your learning stays with you — only the checkmarks will be cleared."
        confirmLabel="Clear Progress"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        variant="danger"
      />
    </section>
  );
}

function InstallApp() {
  const { canInstall, isInstalled, install } = usePWAInstall();

  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>Install App</h2>
      {isInstalled ? (
        <div className="flex items-center gap-2 text-sm text-success">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8.5 6.5 12 13 4" />
          </svg>
          Bitcoin Visual is installed.
        </div>
      ) : canInstall ? (
        <>
          <p className={SECTION_DESC}>
            Install Bitcoin Visual for offline access and a native app experience.
          </p>
          <button type="button" className={BTN_PRIMARY} onClick={install}>
            Install Bitcoin Visual
          </button>
        </>
      ) : (
        <p className="text-sm text-text-muted">
          Installation is not available in this browser. Try Chrome or Edge on desktop, or add to
          home screen on mobile.
        </p>
      )}
    </section>
  );
}

export default function Settings() {
  return (
    <PageBackground>
      <div className="relative z-10 mx-auto max-w-2xl px-5 py-12 md:px-8 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13l-5-5 5-5" />
            </svg>
            Back to Home
          </Link>
          <h1 className="mb-8 text-3xl font-bold text-text-primary">Settings</h1>

          <div className="space-y-5">
            <ThemeToggle />
            <LearningProgress />
            <InstallApp />
          </div>
        </motion.div>
      </div>
    </PageBackground>
  );
}
