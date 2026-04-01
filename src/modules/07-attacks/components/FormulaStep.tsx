import { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexBox, CopyButton } from "../../../shared/components/index.ts";
import { BTN_GHOST, SECTION_LABEL, STEP_VARIANTS } from "../../../shared/components/styles.ts";

interface Substitution {
  label: string;
  value: string;
}

interface FormulaResult {
  label: string;
  value: string;
  variant?: "default" | "danger" | "info" | "success";
}

interface FormulaStepProps {
  stepNumber: number;
  title: string;
  symbolic: string;
  substitutions?: Substitution[];
  result?: FormulaResult;
  status?: "success" | "failure";
  failureMessage?: string;
  revealed?: boolean;
  onReveal?: () => void;
}

export function FormulaStep({
  stepNumber,
  title,
  symbolic,
  substitutions,
  result,
  status,
  failureMessage,
  revealed = true,
  onReveal,
}: FormulaStepProps) {
  const regionId = useId();

  return (
    <motion.div
      variants={STEP_VARIANTS}
      className={`panel-cool rounded-input border p-5 ${
        status === "failure"
          ? "border-danger/30"
          : status === "success"
            ? "border-success/30"
            : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {stepNumber}
        </span>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </div>

      {!revealed ? (
        <button
          type="button"
          className={BTN_GHOST}
          onClick={onReveal}
          aria-expanded={false}
          aria-controls={regionId}
        >
          Reveal next step
        </button>
      ) : (
        <div id={regionId} role="region" aria-label={`Step ${stepNumber}: ${title}`}>
          <code className="mb-4 block overflow-x-auto whitespace-pre-wrap break-all rounded-callout bg-surface-raised p-3 font-mono text-sm leading-relaxed text-text-primary">
            {symbolic}
          </code>

          <AnimatePresence initial={false}>
            {substitutions && substitutions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 flex flex-wrap gap-3"
              >
                {substitutions.map((sub) => (
                  <div key={sub.label} className="min-w-0 flex-shrink-0">
                    <div className={SECTION_LABEL}>{sub.label}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="max-w-[200px] truncate font-mono text-xs text-text-secondary">
                        {sub.value}
                      </span>
                      <CopyButton text={sub.value} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {status === "failure" && failureMessage ? (
            <div className="rounded-callout border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {failureMessage}
            </div>
          ) : (
            result && (
              <HexBox
                value={result.value}
                label={result.label}
                variant={result.variant ?? "default"}
                truncate
                maxLength={64}
              />
            )
          )}
        </div>
      )}
    </motion.div>
  );
}
