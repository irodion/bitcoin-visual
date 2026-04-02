import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePWAInstall } from "../hooks/usePWAInstall.ts";
import { BTN_PRIMARY } from "./styles.ts";

const DISMISSED_KEY = "bitcoinvisual-install-dismissed";

export function InstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleInstall = async () => {
    await install();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-20 right-5 z-40 w-72 rounded-card border border-border-strong bg-surface-raised p-5 shadow-container"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          role="complementary"
          aria-label="Install application"
        >
          <button
            type="button"
            className="absolute right-3 top-3 cursor-pointer text-text-muted transition-colors hover:text-text-primary"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>

          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-text-primary">Install Bitcoin Visual</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Add to your home screen for offline access and a native app experience.
          </p>

          <button type="button" className={`${BTN_PRIMARY} mt-4 w-full`} onClick={handleInstall}>
            Install
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
