import { useState, useRef, useMemo, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bytesToHex } from "@noble/hashes/utils.js";
import { HexBox } from "./HexBox";
import {
  BTN_PRIMARY,
  BTN_GHOST,
  SECTION_LABEL,
  STEP_VARIANTS,
  CHECK_ICON_PATH,
  WARNING_ICON_PATH,
} from "./styles";
import { useProgressStore } from "../stores/useProgressStore";

/* ── Public types ── */

export interface CodeOption {
  key: "A" | "B" | "C";
  label: string;
  code: string;
  computeDigest?: (input: Uint8Array) => Uint8Array;
}

interface ChallengeReveal {
  summary: string;
  details: string;
  dangerNote?: string;
}

export interface CodeReviewChallengeData {
  moduleKey: string;
  title: string;
  prompt: string;
  referenceInput: Uint8Array;
  options: readonly [CodeOption, CodeOption, CodeOption];
  correctKey: "A" | "B" | "C";
  reveal: ChallengeReveal;
}

/* ── Minimal pseudocode highlighting ── */

const TYPE_KEYWORDS = new Set(["byte[]", "int", "void", "bool", "string"]);
const ACCENT_FUNCTIONS = new Set([
  "sha256",
  "txid",
  "ripemd160",
  "base58encode",
  "p2pkh",
  "addInput",
  "addOutput",
  "buildSendTx",
  "writeLE32",
  "toUint256",
  "mine",
]);

function highlightPseudo(code: string): ReactNode {
  const lines = code.split("\n");
  return lines.map((line, li) => {
    const trimmed = line.trimStart();

    // Comment lines
    if (trimmed.startsWith("//")) {
      return (
        <span key={li}>
          {li > 0 && "\n"}
          <span className="text-text-secondary">{line}</span>
        </span>
      );
    }

    // Tokenize by whitespace and parens, preserving delimiters
    const tokens = line.split(/(\s+|[(){}[\],;=])/);
    let nextIsFuncName = false;

    const highlighted = tokens.map((token, ti) => {
      if (TYPE_KEYWORDS.has(token)) {
        nextIsFuncName = true;
        return (
          <span key={ti} className="text-info">
            {token}
          </span>
        );
      }
      if (nextIsFuncName && token.trim().length > 0 && !/[(){}[\],;=]/.test(token)) {
        nextIsFuncName = false;
        // Function names or variable names after a type — highlight known functions
        if (ACCENT_FUNCTIONS.has(token)) {
          return (
            <span key={ti} className="text-accent">
              {token}
            </span>
          );
        }
        return <span key={ti}>{token}</span>;
      }
      // Whitespace and delimiters pass through without resetting the flag
      if (/^\s*$/.test(token) || /^[(){}[\],;=]$/.test(token)) {
        return <span key={ti}>{token}</span>;
      }
      if (ACCENT_FUNCTIONS.has(token)) {
        nextIsFuncName = false;
        return (
          <span key={ti} className="text-accent">
            {token}
          </span>
        );
      }
      if (token === "return") {
        nextIsFuncName = false;
        return (
          <span key={ti} className="text-info">
            {token}
          </span>
        );
      }
      nextIsFuncName = false;
      return <span key={ti}>{token}</span>;
    });

    return (
      <span key={li}>
        {li > 0 && "\n"}
        {highlighted}
      </span>
    );
  });
}

/* ── Option shuffling ── */

/** Fisher-Yates shuffle of option display order. Keys and labels stay intact
 *  so reveal text that references "Version B" etc. remains correct. */
function shuffleOptions(
  options: readonly [CodeOption, CodeOption, CodeOption],
): readonly [CodeOption, CodeOption, CodeOption] {
  const arr = [options[0], options[1], options[2]];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr as [CodeOption, CodeOption, CodeOption];
}

/* ── Subcomponents ── */

function ResultBanner({ correct }: { correct: boolean }) {
  return (
    <div
      className={
        correct
          ? "flex items-center gap-2.5 rounded-pill border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success"
          : "flex items-center gap-2.5 rounded-pill border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger"
      }
      role="status"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d={correct ? CHECK_ICON_PATH : WARNING_ICON_PATH}
          clipRule="evenodd"
        />
      </svg>
      {correct ? "Correct — nice catch!" : "Not quite — check the dataflow"}
    </div>
  );
}

/* ── Main component ── */

interface CodeReviewChallengeProps {
  challenge: CodeReviewChallengeData;
}

export function CodeReviewChallenge({ challenge }: CodeReviewChallengeProps) {
  const [shuffledOptions] = useState(() => shuffleOptions(challenge.options));
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const markChallengeCompleted = useProgressStore((s) => s.markChallengeCompleted);
  const alreadyCompleted = useProgressStore((s) =>
    s.completedChallenges.includes(challenge.moduleKey),
  );

  const isCorrect = submitted && selectedKey === challenge.correctKey;

  // Compute digests for reveal
  const { digests, hasComputedDigests } = useMemo(() => {
    if (!submitted) return { digests: null, hasComputedDigests: false };
    const computed = shuffledOptions.map((opt) => ({
      key: opt.key,
      label: opt.label,
      hex: opt.computeDigest ? bytesToHex(opt.computeDigest(challenge.referenceInput)) : null,
    }));
    return { digests: computed, hasComputedDigests: computed.some((d) => d.hex !== null) };
  }, [submitted, shuffledOptions, challenge.referenceInput]);

  const handleSubmit = useCallback(() => {
    if (selectedKey === null) return;
    setSubmitted(true);
    if (selectedKey === challenge.correctKey) {
      markChallengeCompleted(challenge.moduleKey);
    }
  }, [selectedKey, challenge.correctKey, challenge.moduleKey, markChallengeCompleted]);

  const handleReset = useCallback(() => {
    setSelectedKey(null);
    setSubmitted(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (submitted) return;
      const keys = shuffledOptions.map((o) => o.key);
      const currentIdx = selectedKey ? keys.indexOf(selectedKey) : -1;
      let nextIdx = -1;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        nextIdx = currentIdx < keys.length - 1 ? currentIdx + 1 : 0;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        nextIdx = currentIdx > 0 ? currentIdx - 1 : keys.length - 1;
      }

      if (nextIdx >= 0) {
        setSelectedKey(keys[nextIdx]);
        optionRefs.current[nextIdx]?.focus();
      }
    },
    [submitted, selectedKey, shuffledOptions],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className={SECTION_LABEL}>Code Review</span>
          {alreadyCompleted && !submitted && (
            <span className="inline-flex items-center gap-1 rounded-badge border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d={CHECK_ICON_PATH} clipRule="evenodd" />
              </svg>
              Previously answered
            </span>
          )}
        </div>
        <h3 className="mb-1 text-lg font-semibold text-text-primary">{challenge.title}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{challenge.prompt}</p>
      </div>

      {/* Options */}
      <div
        role="radiogroup"
        aria-label="Code options"
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
        {shuffledOptions.map((opt, idx) => {
          const isSelected = selectedKey === opt.key;
          const isCorrectOption = opt.key === challenge.correctKey;

          const buttonClass =
            submitted && isCorrectOption
              ? "panel-cool w-full cursor-pointer rounded-card border border-success/50 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default"
              : submitted && isSelected && !isCorrectOption
                ? "panel-cool w-full cursor-pointer rounded-card border border-danger/50 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default"
                : isSelected
                  ? "panel-cool w-full cursor-pointer rounded-card border border-accent shadow-(--shadow-glow-accent-inset) p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default"
                  : "panel-cool w-full cursor-pointer rounded-card border border-border hover:border-border-strong p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default";

          const badgeClass =
            submitted && isCorrectOption
              ? "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-success/15 text-success"
              : submitted && isSelected && !isCorrectOption
                ? "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-danger/15 text-danger"
                : isSelected
                  ? "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-accent/15 text-accent"
                  : "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-accent/10 text-accent";

          return (
            <button
              key={opt.key}
              ref={(el) => {
                optionRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={opt.label}
              disabled={submitted}
              tabIndex={isSelected || (!selectedKey && idx === 0) ? 0 : -1}
              onClick={() => setSelectedKey(opt.key)}
              className={buttonClass}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className={badgeClass}>{opt.key}</span>
                <span className="text-sm font-semibold text-text-primary">{opt.label}</span>
              </div>
              <pre className="overflow-x-auto rounded-callout bg-input-bg p-4 font-mono text-xs leading-relaxed text-text-primary md:text-sm">
                <code>{highlightPseudo(opt.code)}</code>
              </pre>
            </button>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={selectedKey === null}
          onClick={handleSubmit}
        >
          Submit answer
        </button>
      )}

      {/* Reveal */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            key="reveal"
            variants={STEP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-5"
          >
            <ResultBanner correct={isCorrect} />

            <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
              <p className="font-medium text-text-primary">{challenge.reveal.summary}</p>
              <p>{challenge.reveal.details}</p>
              {challenge.reveal.dangerNote && (
                <div className="rounded-callout border border-warning-border bg-warning-bg p-4 text-sm text-warning-text">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-warning-heading">
                    Why this is dangerous
                  </p>
                  {challenge.reveal.dangerNote}
                </div>
              )}
            </div>

            {/* Live digest comparison */}
            {hasComputedDigests && digests && (
              <div className="space-y-3">
                <p className={SECTION_LABEL}>Computed digests for comparison</p>
                {digests.map(
                  (d) =>
                    d.hex && (
                      <HexBox
                        key={d.key}
                        label={d.label}
                        value={d.hex}
                        variant={d.key === challenge.correctKey ? "success" : "danger"}
                        truncate
                        maxLength={64}
                      />
                    ),
                )}
              </div>
            )}

            <button type="button" className={BTN_GHOST} onClick={handleReset}>
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
