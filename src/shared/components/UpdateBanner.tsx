import { AnimatePresence, motion } from "framer-motion";
import { useSWUpdate } from "../hooks/useSWUpdate.ts";

export function UpdateBanner() {
  const { needRefresh, update, dismiss } = useSWUpdate();

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-max items-center gap-3 rounded-pill border border-border-strong px-5 py-2.5 shadow-container panel-cool"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          role="alert"
        >
          <span className="text-sm text-text-primary">New version available</span>
          <button
            type="button"
            className="cursor-pointer rounded-pill bg-accent px-4 py-1.5 text-xs font-bold text-[#111723] transition-opacity hover:opacity-90 active:opacity-80"
            onClick={() => update()}
          >
            Reload
          </button>
          <button
            type="button"
            className="cursor-pointer text-text-muted transition-colors hover:text-text-primary"
            onClick={dismiss}
            aria-label="Dismiss update notification"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
