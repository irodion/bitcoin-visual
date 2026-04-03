import { motion, AnimatePresence } from "framer-motion";
import { BTN_PRIMARY, BTN_GHOST, STEP_VARIANTS } from "../../../shared/components/styles.ts";
import {
  BOOTSTRAP_STAGES,
  BOOTSTRAP_TIMER_SECONDS,
  type BootstrapStage,
} from "./networkConstants.ts";

interface BootstrapWaterfallProps {
  stage: BootstrapStage | null;
  timer: number;
  running: boolean;
  completed: Set<BootstrapStage>;
  onStart: () => void;
  onReset: () => void;
}

function StageBar({
  stageKey,
  label,
  description,
  detail,
  historical,
  isActive,
  isCompleted,
  timer,
}: {
  stageKey: BootstrapStage;
  label: string;
  description: string;
  detail: string;
  historical?: boolean;
  isActive: boolean;
  isCompleted: boolean;
  timer: number;
}) {
  const showTimer = stageKey === "peers-dat" && isActive;
  const timerDisplay = Math.min(timer, BOOTSTRAP_TIMER_SECONDS);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-inner border p-4 transition-colors ${
        historical
          ? "border-border/50 bg-bg/50 opacity-50"
          : isActive
            ? "border-accent/40 bg-accent/5"
            : isCompleted
              ? "border-success/30 bg-success/5"
              : "border-border bg-bg"
      }`}
      data-testid={`bootstrap-stage-${stageKey}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isActive
                ? "bg-accent text-text-on-accent"
                : isCompleted
                  ? "bg-success text-text-on-accent"
                  : "bg-surface-raised text-text-muted"
            }`}
          >
            {isCompleted ? "✓" : isActive ? "…" : "○"}
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${historical ? "line-through" : "text-text-primary"}`}
            >
              {label}
            </p>
            <p className="text-xs text-text-secondary">
              {description}
              {historical && <span className="ml-1 text-text-muted">(removed v0.8.2, 2012)</span>}
            </p>
          </div>
        </div>

        {showTimer && (
          <div className="shrink-0 text-right">
            <span className="font-mono text-lg font-bold text-accent">{timerDisplay}s</span>
            <p className="text-[10px] text-text-muted">/ {BOOTSTRAP_TIMER_SECONDS}s timeout</p>
          </div>
        )}

        {isCompleted && !historical && (
          <span className="shrink-0 text-xs font-semibold text-success">Done</span>
        )}
      </div>

      {(isActive || isCompleted) && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 text-xs leading-relaxed text-text-muted"
        >
          {detail}
        </motion.p>
      )}
    </motion.div>
  );
}

export function BootstrapWaterfall({
  stage,
  timer,
  running,
  completed,
  onStart,
  onReset,
}: BootstrapWaterfallProps) {
  const hasStarted = stage !== null;
  const stageIdx = BOOTSTRAP_STAGES.findIndex((bs) => bs.key === stage);

  return (
    <motion.section
      variants={STEP_VARIANTS}
      className="space-y-4 rounded-card border border-border bg-surface-raised p-5"
      aria-labelledby="bootstrap-heading"
    >
      <div>
        <h3 id="bootstrap-heading" className="text-lg font-bold text-text-primary">
          4 · Bootstrap Waterfall
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          How does a brand-new Bitcoin node find the network for the first time?
        </p>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {BOOTSTRAP_STAGES.map((s, thisIdx) => {
            const isVisible = hasStarted && thisIdx <= stageIdx;
            const isActive = stage === s.key && !completed.has(s.key);
            const isCompleted = completed.has(s.key);

            if (!isVisible) return null;

            return (
              <StageBar
                key={s.key}
                stageKey={s.key}
                label={s.label}
                description={s.description}
                detail={s.detail}
                historical={s.historical}
                isActive={isActive}
                isCompleted={isCompleted}
                timer={timer}
              />
            );
          })}
        </AnimatePresence>

        {!hasStarted && (
          <div className="rounded-inner border border-dashed border-border bg-bg/50 py-12 text-center">
            <p className="text-sm text-text-muted">
              Press "Start Bootstrap" to simulate a fresh node joining the network
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onStart} className={BTN_PRIMARY} disabled={running}>
          {running ? "Running…" : hasStarted ? "Restart" : "Start Bootstrap"}
        </button>
        {hasStarted && (
          <button type="button" onClick={onReset} className={BTN_GHOST}>
            Reset
          </button>
        )}
      </div>

      <div className="rounded-inner border border-success/20 bg-success/5 px-4 py-3">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-success">The 11-second race:</span> On startup,
          Bitcoin Core tries saved peers for 11 seconds before querying DNS seeds. If even one saved
          peer responds, DNS is never touched — minimizing information leakage about node restarts.
          Satoshi's original method decoded IRC channel nicknames as IP addresses (removed 2012).
        </p>
      </div>
    </motion.section>
  );
}
