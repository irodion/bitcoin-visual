import { useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256, sha256d, ripemd160, hash160 } from "../../../shared/crypto/index.ts";
import { HexBox, ValueFlowArrow } from "../../../shared/components/index.ts";
import { TEXTAREA, LABEL, SECTION_LABEL } from "../../../shared/components/styles.ts";
import { PresetInputs } from "../components/PresetInputs.tsx";

const encoder = new TextEncoder();

interface PlaygroundTabProps {
  input: string;
  setInput: (v: string) => void;
  onInteract: () => void;
}

export function PlaygroundTab({ input, setInput, onInteract }: PlaygroundTabProps) {
  const inputBytes = useMemo(() => encoder.encode(input), [input]);
  const sha256Hash = useMemo(() => sha256(inputBytes), [inputBytes]);
  const sha256dHash = useMemo(() => sha256d(inputBytes), [inputBytes]);
  const sha256Hex = useMemo(() => bytesToHex(sha256Hash), [sha256Hash]);
  const ripemd160Hash = useMemo(() => ripemd160(inputBytes), [inputBytes]);
  const hash160Hash = useMemo(() => hash160(inputBytes), [inputBytes]);

  function handlePresetSelect(value: string) {
    onInteract();
    setInput(value);
  }

  return (
    <div className="space-y-6">
      {/* ── INPUT STAGE ── */}
      <section>
        <div className={SECTION_LABEL}>Input</div>

        <div className="panel-cool mt-2 rounded-section border border-border p-5 md:p-6">
          <label htmlFor="hash-input" className={LABEL}>
            Message
          </label>
          <textarea
            id="hash-input"
            rows={3}
            value={input}
            onChange={(e) => {
              onInteract();
              setInput(e.target.value);
            }}
            placeholder="Type anything here..."
            className={TEXTAREA}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <span className="border-l-2 border-accent bg-badge-bg px-3 py-1.5 text-sm font-bold text-text-primary">
                {input.length} chars
              </span>
              <span className="border-l-2 border-teal bg-badge-bg px-3 py-1.5 text-sm font-bold text-text-primary">
                {inputBytes.length} bytes
              </span>
              <span className="border-l-2 border-text-muted bg-badge-bg px-3 py-1.5 text-sm font-bold text-text-secondary">
                UTF-8
              </span>
            </div>

            <div className="ml-auto">
              <PresetInputs onSelect={handlePresetSelect} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOW ARROW ── */}
      <ValueFlowArrow
        label="SHA-256"
        description="Cryptographic hash: maps any input to a fixed 256-bit output"
        animationKey={sha256Hex}
      />

      {/* ── OUTPUT STAGE ── */}
      <section>
        <div className={SECTION_LABEL}>Output</div>

        <div className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="panel-cool rounded-section border border-border p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-text-primary md:text-[22px]">SHA-256</h3>
              <span className="rounded-badge border border-badge-info-border bg-badge-info-bg px-3 py-1 text-[12px] font-bold text-info">
                256-BIT OUTPUT
              </span>
            </div>
            <HexBox value={sha256Hash} label="SHA-256 Hash" variant="info" />
          </div>

          <div className="panel-warm rounded-section border border-border-amber p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-warning-heading md:text-[22px]">SHA-256d</h3>
              <span className="rounded-badge border border-badge-warm-border bg-badge-warm-bg px-3 py-1 text-[12px] font-bold text-warning-text">
                DOUBLE HASH
              </span>
            </div>
            <HexBox value={sha256dHash} label="SHA-256d (Double Hash)" variant="warm" />
          </div>
        </div>
      </section>

      {/* ── ALGORITHM COMPARISON ── */}
      <section>
        <div className={SECTION_LABEL}>Algorithm Comparison</div>

        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
              RIPEMD-160 · 160-bit
            </div>
            <HexBox value={ripemd160Hash} label="RIPEMD-160" />
          </div>
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
              HASH160 · Address derivation
            </div>
            <HexBox value={hash160Hash} label="HASH160" variant="success" />
          </div>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          Bitcoin uses HASH160 (SHA-256 → RIPEMD-160) to derive addresses, producing a shorter
          20-byte fingerprint.
        </p>
      </section>
    </div>
  );
}
