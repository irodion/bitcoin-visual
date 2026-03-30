import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STEP_VARIANTS,
  BTN_PRIMARY,
  BTN_GHOST,
  INPUT,
  LABEL,
} from "../../shared/components/styles.ts";
import {
  TOY_BASE,
  TOY_ORDER,
  formatPoint,
  type ECPoint,
  type ScalarStep,
} from "../../shared/crypto/toyEC.ts";
import { PointGrid } from "./PointGrid.tsx";

// ── Binary Display ──

function BinaryDisplay({ value, highlightBit }: { value: number; highlightBit: number }) {
  const bits = value.toString(2);
  return (
    <div className="flex items-center gap-0.5 font-mono text-sm">
      <span className="mr-2 text-xs text-text-muted">binary:</span>
      {/* Bits are MSB-first; index 0 is the leading 1-bit (Init step).
         highlightBit is the step index (0-based), mapping to bit string index highlightBit + 1. */}
      {bits.split("").map((bit, i) => (
        <span
          key={i}
          className={`inline-flex h-6 w-5 items-center justify-center rounded ${
            highlightBit >= 0 && i === highlightBit + 1
              ? "bg-accent/20 font-bold text-accent"
              : i === 0
                ? "bg-accent/10 font-bold text-accent/60"
                : "text-text-secondary"
          }`}
        >
          {bit}
        </span>
      ))}
    </div>
  );
}

// ── Step Card ──

function StepCard({
  step,
  index,
  isActive,
  isFuture,
}: {
  step: ScalarStep;
  index: number;
  isActive: boolean;
  isFuture: boolean;
}) {
  return (
    <motion.div
      variants={STEP_VARIANTS}
      initial="hidden"
      animate="visible"
      className={`rounded-sm border p-3 text-xs transition-colors ${
        isActive
          ? "border-accent/40 bg-accent/5"
          : isFuture
            ? "border-border/50 opacity-40"
            : "border-border bg-surface/50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-text-muted">Step {index + 1}</span>
        <span className={`font-mono ${step.bit === 1 ? "text-accent" : "text-text-secondary"}`}>
          bit={step.bit}
        </span>
        <span className="text-text-secondary">
          <span className="text-text-muted">2&times;acc =</span>{" "}
          <span className="font-mono">{formatPoint(step.doubled)}</span>
        </span>
        {step.bit === 1 ? (
          <span className="text-text-secondary">
            <span className="text-text-muted">+ P =</span>{" "}
            <span className="font-mono text-accent">{formatPoint(step.accumulator)}</span>
          </span>
        ) : (
          <span className="italic text-text-muted">skip add</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ──

interface ScalarMultStepperProps {
  scalar: number;
  setScalar: (k: number) => void;
  scalarSteps: ScalarStep[];
  scalarResult: ECPoint;
  currentStepIndex: number;
  autoPlay: boolean;
  setAutoPlay: (v: boolean) => void;
  stepForward: () => void;
  stepBackward: () => void;
  resetSteps: () => void;
}

export function ScalarMultStepper({
  scalar,
  setScalar,
  scalarSteps,
  scalarResult,
  currentStepIndex,
  autoPlay,
  setAutoPlay,
  stepForward,
  stepBackward,
  resetSteps,
}: ScalarMultStepperProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      stepForward();
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, stepForward]);

  // Stop auto-play when complete
  useEffect(() => {
    if (autoPlay && currentStepIndex >= scalarSteps.length - 1 && scalarSteps.length > 0) {
      setAutoPlay(false);
    }
  }, [autoPlay, currentStepIndex, scalarSteps.length, setAutoPlay]);

  // Reset steps when scalar changes
  useEffect(() => {
    resetSteps();
  }, [scalar, resetSteps]);

  const isComplete = currentStepIndex >= scalarSteps.length - 1 && scalarSteps.length > 0;

  const tracePoints = useMemo(() => {
    if (currentStepIndex < 0) return [];
    return scalarSteps.slice(0, currentStepIndex + 1).map((s) => s.accumulator);
  }, [currentStepIndex, scalarSteps]);

  const currentAcc = useMemo(
    () =>
      currentStepIndex >= 0 && currentStepIndex < scalarSteps.length
        ? scalarSteps[currentStepIndex].accumulator
        : null,
    [currentStepIndex, scalarSteps],
  );

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className={LABEL} htmlFor="scalar-input">
            Scalar k
          </label>
          <input
            id="scalar-input"
            type="number"
            min={1}
            max={Number(TOY_ORDER) - 1}
            value={scalar}
            onChange={(e) => {
              const v = Math.max(1, Math.min(Number(TOY_ORDER) - 1, Number(e.target.value) || 1));
              setScalar(v);
            }}
            className={`${INPUT} w-24`}
          />
        </div>
        <div className="pb-1 font-mono text-sm text-text-secondary">
          k &times; P where P = {formatPoint(TOY_BASE)}
        </div>
      </div>

      {/* Binary */}
      {scalar > 0 && <BinaryDisplay value={scalar} highlightBit={currentStepIndex} />}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={BTN_GHOST}
          onClick={stepBackward}
          disabled={currentStepIndex < 0}
        >
          &larr; Back
        </button>
        <button type="button" className={BTN_PRIMARY} onClick={stepForward} disabled={isComplete}>
          Step &rarr;
        </button>
        <button
          type="button"
          className={BTN_GHOST}
          onClick={() => {
            if (autoPlay) {
              setAutoPlay(false);
            } else {
              if (isComplete) resetSteps();
              setAutoPlay(true);
            }
          }}
        >
          {autoPlay ? "Pause" : "Auto Play"}
        </button>
        <button type="button" className={BTN_GHOST} onClick={resetSteps}>
          Reset
        </button>
      </div>

      {/* Step cards */}
      <div className="space-y-1.5">
        {/* Leading bit */}
        <div
          className={`rounded-sm border p-3 text-xs ${
            currentStepIndex < 0 ? "border-accent/40 bg-accent/5" : "border-border bg-surface/50"
          }`}
        >
          <span className="font-semibold text-text-muted">Init</span>{" "}
          <span className="font-mono text-accent">MSB=1, acc = P = {formatPoint(TOY_BASE)}</span>
        </div>

        <AnimatePresence>
          {scalarSteps.map((step, i) => (
            <StepCard
              key={`${scalar}-${i}`}
              step={step}
              index={i}
              isActive={i === currentStepIndex}
              isFuture={i > currentStepIndex}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Result */}
      {isComplete && (
        <motion.div
          variants={STEP_VARIANTS}
          initial="hidden"
          animate="visible"
          className="panel-cool rounded-input border border-border p-5 text-center"
        >
          <p className="text-xs text-text-muted">Result</p>
          <p className="font-mono text-lg font-bold text-success">
            {scalar} &times; P = {formatPoint(scalarResult)}
          </p>
        </motion.div>
      )}

      {/* Grid showing trace */}
      <PointGrid
        selectedP={TOY_BASE}
        resultPoint={currentAcc && currentAcc !== "infinity" ? currentAcc : undefined}
        tracePoints={tracePoints}
      />
    </div>
  );
}
