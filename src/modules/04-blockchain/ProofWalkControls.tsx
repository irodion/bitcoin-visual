import { motion, AnimatePresence } from "framer-motion";
import { BTN_PRIMARY, BTN_GHOST } from "../../shared/components/styles.ts";

interface ProofWalkControlsProps {
  totalSteps: number;
  walkStep: number | null;
  autoPlay: boolean;
  stepDescription: string | null;
  onToggleWalk: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onToggleAutoPlay: () => void;
  onReset: () => void;
}

export function ProofWalkControls({
  totalSteps,
  walkStep,
  autoPlay,
  stepDescription,
  onToggleWalk,
  onStepForward,
  onStepBackward,
  onToggleAutoPlay,
  onReset,
}: ProofWalkControlsProps) {
  const isWalking = walkStep !== null;
  const isAtStart = walkStep === null || walkStep <= 0;
  const isAtEnd = walkStep !== null && walkStep >= totalSteps - 1;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={isWalking ? BTN_GHOST : BTN_PRIMARY}
          onClick={onToggleWalk}
          aria-label={isWalking ? "Show all proof steps" : "Walk through proof steps"}
        >
          {isWalking ? "Show All" : "Walk Proof"}
        </button>

        {isWalking && (
          <>
            <button
              type="button"
              className={BTN_GHOST}
              onClick={onStepBackward}
              disabled={isAtStart}
              aria-label="Previous proof step"
            >
              &larr; Back
            </button>

            <span
              className="min-w-[5rem] rounded-pill border border-accent/30 bg-accent/10 px-3 py-1.5 text-center font-mono text-xs font-semibold text-accent"
              aria-live="polite"
            >
              {(walkStep ?? 0) + 1} / {totalSteps}
            </span>

            <button
              type="button"
              className={BTN_GHOST}
              onClick={onStepForward}
              disabled={isAtEnd}
              aria-label="Next proof step"
            >
              Next &rarr;
            </button>

            <button
              type="button"
              className={BTN_GHOST}
              onClick={onToggleAutoPlay}
              aria-label={autoPlay ? "Pause auto-play" : "Auto-play proof steps"}
            >
              {autoPlay ? "Pause" : "Auto Play"}
            </button>

            <button
              type="button"
              className={BTN_GHOST}
              onClick={onReset}
              aria-label="Reset proof walk to first step"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Step description */}
      <AnimatePresence mode="wait">
        {isWalking && stepDescription && (
          <motion.div
            key={walkStep}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-inner border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-text-primary"
          >
            <span className="mr-1.5 font-bold text-accent">Step {(walkStep ?? 0) + 1}:</span>
            {stepDescription}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
