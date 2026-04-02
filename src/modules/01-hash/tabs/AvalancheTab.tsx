import { useState, useMemo, useEffect } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "../../../shared/crypto/index.ts";
import { BTN_PRIMARY, BTN_GHOST, TEXTAREA, LABEL } from "../../../shared/components/styles.ts";
import { BitDiffBar, countBitDifferences } from "../components/BitDiffBar.tsx";
import { DiffHex } from "../components/DiffHex.tsx";
import { BitGrid } from "../components/BitGrid.tsx";

const encoder = new TextEncoder();

interface AvalancheTabProps {
  input: string;
  setInput: (v: string) => void;
  onInteract: () => void;
}

export function AvalancheTab({ input, setInput, onInteract }: AvalancheTabProps) {
  const [flipIndex, setFlipIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  // Reset flip index when input changes from parent
  useEffect(() => {
    setFlipIndex(null);
  }, [input]);

  const inputBytes = useMemo(() => encoder.encode(input), [input]);
  const sha256Hash = useMemo(() => sha256(inputBytes), [inputBytes]);

  const targetIndex = flipIndex ?? Math.max(0, input.length - 1);

  const modifiedInput = useMemo(() => {
    if (input.length === 0) return "";
    const idx = Math.min(targetIndex, input.length - 1);
    const targetChar = input.charCodeAt(idx);
    const flipped = String.fromCharCode(targetChar ^ 1);
    return input.slice(0, idx) + flipped + input.slice(idx + 1);
  }, [input, targetIndex]);

  const sha256Modified = useMemo(() => sha256(encoder.encode(modifiedInput)), [modifiedInput]);

  const bitDiff = useMemo(
    () => countBitDifferences(sha256Hash, sha256Modified),
    [sha256Hash, sha256Modified],
  );

  function handleRandomInput() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    onInteract();
    setInput(bytesToHex(bytes));
  }

  function handleCharClick(index: number) {
    onInteract();
    setFlipIndex(index);
  }

  function handleCharKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCharClick(index);
    }
  }

  const origChar = input.length > 0 ? input[Math.min(targetIndex, input.length - 1)] : "";
  const flippedChar =
    input.length > 0
      ? String.fromCharCode(input.charCodeAt(Math.min(targetIndex, input.length - 1)) ^ 1)
      : "";

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Click any character to select the flip point. The hash changes completely regardless of
        which bit you flip. Red bytes differ, teal bytes match.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Original input — character click mode or edit mode */}
        <div className="panel-cool rounded-input border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className={LABEL}>Original</label>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="text-xs text-text-secondary hover:text-accent"
              title={editing ? "Switch to character selector" : "Edit text"}
            >
              {editing ? "✓ Done" : "✎ Edit"}
            </button>
          </div>

          {editing ? (
            <textarea
              rows={2}
              value={input}
              onChange={(e) => {
                onInteract();
                setInput(e.target.value);
              }}
              className={TEXTAREA}
            />
          ) : (
            <div
              className="min-h-[3.5rem] break-all rounded-inner border border-input-border bg-input-bg p-3 font-mono text-sm leading-relaxed md:text-base"
              aria-label="Original input — click a character to select flip point"
            >
              {input.length === 0 ? (
                <span className="text-text-muted">(empty)</span>
              ) : (
                input.split("").map((char, i) => (
                  <span
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select character '${char}' at position ${i}`}
                    onClick={() => handleCharClick(i)}
                    onKeyDown={(e) => handleCharKeyDown(e, i)}
                    className={`inline-block cursor-pointer rounded-sm px-[1px] transition-colors ${
                      i === Math.min(targetIndex, input.length - 1)
                        ? "bg-accent/20 ring-1 ring-accent"
                        : "hover:bg-surface-raised"
                    }`}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))
              )}
            </div>
          )}

          {input.length > 0 && !editing && (
            <p className="mt-2 text-xs text-text-muted">
              Flipping position {Math.min(targetIndex, input.length - 1)}: '{origChar}' → '
              {flippedChar}'
            </p>
          )}
        </div>

        {/* Modified input */}
        <div className="panel-cool rounded-input border border-border p-4">
          <label htmlFor="avalanche-modified" className={LABEL}>
            Modified (bit-flipped)
          </label>
          <textarea
            id="avalanche-modified"
            rows={2}
            value={modifiedInput}
            readOnly
            className={`${TEXTAREA} text-text-secondary`}
          />
        </div>
      </div>

      <DiffHex original={sha256Hash} modified={sha256Modified} />

      {/* ── Bit Grid ── */}
      <div className="rounded-input border border-border bg-[#0E1521] p-5">
        <h3 className="mb-3 text-base font-bold text-text-primary">Bit Map</h3>
        <BitGrid original={sha256Hash} modified={sha256Modified} diffCount={bitDiff} />
      </div>

      {/* ── Bit Counter + Bar ── */}
      <div className="rounded-input border border-border bg-[#0E1521] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">Bit Difference</h3>
            <p className="text-sm text-text-muted">
              One changed character flips ~50% of the 256 output bits.
            </p>
          </div>
          <div className="rounded-input border border-border-secondary bg-badge-bg px-5 py-3 text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">
              BITS CHANGED
            </div>
            <div className="font-mono text-2xl font-bold text-accent">
              <span>{bitDiff}</span>
              <span className="ml-2 text-sm font-normal text-text-secondary">
                of 256 ({((bitDiff / 256) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        <BitDiffBar original={sha256Hash} modified={sha256Modified} />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleRandomInput} className={BTN_PRIMARY}>
          Random Input
        </button>
        {flipIndex !== null && (
          <button type="button" onClick={() => setFlipIndex(null)} className={BTN_GHOST}>
            Reset Flip Point
          </button>
        )}
      </div>
    </div>
  );
}
