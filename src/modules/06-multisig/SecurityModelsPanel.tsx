import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  STEP_VARIANTS,
  CONTAINER_VARIANTS,
  LABEL,
  CHECK_ICON_PATH,
} from "../../shared/components/styles.ts";
import { SECURITY_MODELS } from "./securityModelsData.ts";
import { ModelGraph } from "./ModelGraph.tsx";

function StepperCircle({
  model,
  index,
  activeIndex,
  onClick,
}: {
  model: (typeof SECURITY_MODELS)[number];
  index: number;
  activeIndex: number;
  onClick: () => void;
}) {
  const isActive = index === activeIndex;
  const isVisited = index < activeIndex;

  let bg: string;
  if (isActive) bg = "bg-accent text-text-on-accent";
  else if (isVisited) bg = "bg-success text-text-on-accent";
  else bg = "bg-surface-raised text-text-muted";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={`Model ${model.id}: ${model.title}`}
      className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-colors ${bg}`}
      onClick={onClick}
    >
      {isVisited ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d={CHECK_ICON_PATH} />
        </svg>
      ) : (
        model.id
      )}
    </button>
  );
}

// ── Edge type legend ──

const LEGEND_ITEMS = [
  { color: "bg-accent", label: "Controls" },
  { color: "bg-teal", label: "Co-signs" },
  { color: "bg-info", label: "Policy" },
] as const;

function EdgeLegend() {
  return (
    <div className="flex items-center justify-center gap-4">
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`h-2 w-5 rounded-full ${color}`} />
          <span className="text-[10px] font-medium text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tradeoff Cards ──

function TradeoffCards({ fixes, introduces }: { fixes: string; introduces: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="rounded-callout border border-success/40 bg-success/5 p-4">
        <span className={LABEL}>Fixes</span>
        <p className="text-sm leading-relaxed text-text-primary">{fixes}</p>
      </div>
      <div className="rounded-callout border border-danger/40 bg-danger/5 p-4">
        <span className={LABEL}>Risk</span>
        <p className="text-sm leading-relaxed text-text-primary">{introduces}</p>
      </div>
    </div>
  );
}

// ── Main Panel ──

export function SecurityModelsPanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const model = SECURITY_MODELS[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === SECURITY_MODELS.length - 1;

  return (
    <motion.div
      className="mx-auto max-w-3xl space-y-5"
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      {/* Stepper */}
      <motion.div variants={STEP_VARIANTS}>
        <div
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Security model steps"
        >
          {SECURITY_MODELS.map((m, i) => (
            <StepperCircle
              key={m.id}
              model={m}
              index={i}
              activeIndex={activeIndex}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </motion.div>

      {/* Model content — animated on switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={model.id}
          className="space-y-4"
          variants={STEP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Header */}
          <div className="text-center">
            <span className="mb-1 inline-block rounded-badge border border-border bg-surface-raised px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
              {model.quorum}
            </span>
            <h3 className="mt-1 text-lg font-bold text-text-primary">
              Model {model.id}: {model.title}
            </h3>
            <p className="text-sm text-text-muted">{model.subtitle}</p>
          </div>

          {/* Narrative */}
          <div className="panel-cool rounded-input border border-border p-4">
            <p className="text-sm leading-relaxed text-text-secondary">{model.narrative}</p>
          </div>

          {/* Graph */}
          <ModelGraph model={model} />

          {/* Legend */}
          <EdgeLegend />

          {/* Description */}
          <p className="text-center text-sm leading-relaxed text-text-secondary">
            {model.description}
          </p>

          {/* Tradeoff cards */}
          <TradeoffCards fixes={model.fixes} introduces={model.introduces} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <motion.div variants={STEP_VARIANTS} className="flex items-center justify-between">
        <button
          type="button"
          className={`${BTN_GHOST} disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={isFirst}
          aria-label="Previous model"
          onClick={() => setActiveIndex((i) => i - 1)}
        >
          ← Previous
        </button>
        <span className="text-xs font-medium text-text-muted">
          {activeIndex + 1} / {SECURITY_MODELS.length}
        </span>
        <button
          type="button"
          className={`${BTN_PRIMARY} disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={isLast}
          aria-label="Next model"
          onClick={() => setActiveIndex((i) => i + 1)}
        >
          Next →
        </button>
      </motion.div>
    </motion.div>
  );
}
