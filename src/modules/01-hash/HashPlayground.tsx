import { useState, useMemo, useEffect } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256, sha256d } from "../../shared/crypto/index.ts";
import {
  ModuleLayout,
  HexBox,
  ValueFlowArrow,
  TheoryConceptCard,
  TheoryCallout,
} from "../../shared/components/index.ts";
import { BTN_PRIMARY, BTN_GHOST, TEXTAREA, LABEL } from "../../shared/components/styles.ts";
import { useModuleCompletion } from "../../shared/hooks/useModuleCompletion.ts";

const encoder = new TextEncoder();

function countBitDifferences(a: Uint8Array, b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) {
      count += xor & 1;
      xor >>= 1;
    }
  }
  return count;
}

/* ── Avalanche bit bar ── */

function BitDiffBar({ original, modified }: { original: Uint8Array; modified: Uint8Array }) {
  const groups = useMemo(() => {
    const result: { differs: boolean; count: number }[] = [];
    for (let i = 0; i < original.length; i++) {
      const xor = original[i] ^ modified[i];
      for (let bit = 7; bit >= 0; bit--) {
        const differs = ((xor >> bit) & 1) === 1;
        const last = result[result.length - 1];
        if (last && last.differs === differs) {
          last.count++;
        } else {
          result.push({ differs, count: 1 });
        }
      }
    }
    return result;
  }, [original, modified]);

  const changed = groups.filter((g) => g.differs).reduce((s, g) => s + g.count, 0);

  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#131C2A]"
      role="img"
      aria-label={`Bit difference visualization: ${changed} of 256 bits differ`}
    >
      {groups.map((g, i) => (
        <div
          key={i}
          className={`h-full ${g.differs ? "bg-danger" : "bg-teal"}`}
          style={{ width: `${(g.count / 256) * 100}%` }}
        />
      ))}
    </div>
  );
}

/* ── DiffHex comparison ── */

function DiffHexColumn({
  title,
  pairs,
  charKey,
}: {
  title: string;
  pairs: Array<{ orig: string; mod: string; differs: boolean }>;
  charKey: "orig" | "mod";
}) {
  return (
    <div className="panel-cool rounded-input border border-border p-4">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
        {title}
      </div>
      <code className="break-all font-mono text-sm leading-relaxed tracking-wide md:text-base">
        {pairs.map((p, i) => (
          <span key={i} className={p.differs ? "rounded-sm bg-danger/10 text-danger" : "text-teal"}>
            {p.differs && <span aria-hidden="true">&middot;</span>}
            {p[charKey]}
            <span className="sr-only">{p.differs ? " differs" : " matches"}</span>
          </span>
        ))}
      </code>
    </div>
  );
}

function DiffHex({ original, modified }: { original: Uint8Array; modified: Uint8Array }) {
  const pairs = useMemo(() => {
    const origHex = bytesToHex(original);
    const modHex = bytesToHex(modified);
    const result: Array<{ orig: string; mod: string; differs: boolean }> = [];
    for (let i = 0; i < origHex.length; i += 2) {
      const orig = origHex.slice(i, i + 2);
      const mod = modHex.slice(i, i + 2);
      result.push({ orig, mod, differs: orig !== mod });
    }
    return result;
  }, [original, modified]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DiffHexColumn title="Original Hash" pairs={pairs} charKey="orig" />
      <DiffHexColumn title="Modified Hash" pairs={pairs} charKey="mod" />
    </div>
  );
}

/* ── Theory content ── */

function TheoryContent() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <h3>What is SHA-256?</h3>
      <p>
        SHA-256 is a cryptographic hash function that maps any input to a fixed{" "}
        <strong>256-bit (32-byte)</strong> output. Bitcoin uses it everywhere: block header hashing,
        transaction IDs (TXIDs), and address derivation via <code>HASH160</code>.
      </p>

      <div className="space-y-3">
        <TheoryConceptCard
          dot="accent"
          title="Determinism"
          description="Same input, same fingerprint. No randomness involved."
        />
        <TheoryConceptCard
          dot="teal"
          title="Avalanche Effect"
          description="One letter shifts the whole digest. Try the demo to see it live."
        />
        <TheoryConceptCard
          dot="danger"
          title="Pre-image Resistance"
          description="You can verify, not reverse. This is what makes proof-of-work hard."
        />
        <TheoryConceptCard
          dot="warning"
          title="Fixed Output Length"
          description="Always 256 bits, always 64 hex chars, regardless of input size."
        />
      </div>

      <TheoryCallout
        label="WHY DOUBLE HASH?"
        title="Bitcoin often uses SHA-256d"
        description="Second round hardens the result against length-extension quirks."
      />

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 cursor-pointer text-xs font-medium text-accent hover:underline"
      >
        {expanded ? "Hide details" : "Why not just once?"}
      </button>
      {expanded && (
        <p className="mt-2">
          Double-hashing guards against <strong>length-extension attacks</strong>. With a single
          SHA-256, an attacker who knows <code>H(m)</code> can compute{" "}
          <code>H(m || padding || extra)</code> without knowing <code>m</code>. Applying SHA-256 a
          second time breaks this.
        </p>
      )}
    </>
  );
}

/* ── Main component ── */

export default function HashPlayground() {
  const [input, setInput] = useState("Hello, Bitcoin!");
  const [mode, setMode] = useState<"normal" | "avalanche">("normal");
  const [hasInteracted, setHasInteracted] = useState(false);
  const { completed, complete } = useModuleCompletion("hash");

  useEffect(() => {
    if (!completed && hasInteracted && input.length > 0) complete();
  }, [input, hasInteracted, completed, complete]);

  const inputBytes = useMemo(() => encoder.encode(input), [input]);
  const sha256Hash = useMemo(() => sha256(inputBytes), [inputBytes]);
  const sha256dHash = useMemo(() => sha256d(inputBytes), [inputBytes]);
  const sha256Hex = useMemo(() => bytesToHex(sha256Hash), [sha256Hash]);
  const sha256dHex = useMemo(() => bytesToHex(sha256dHash), [sha256dHash]);

  const isAvalanche = mode === "avalanche";

  const modifiedInput = useMemo(() => {
    if (!isAvalanche) return "";
    if (input.length === 0) return "";
    const lastChar = input.charCodeAt(input.length - 1);
    const toggled = String.fromCharCode(lastChar ^ 1);
    return input.slice(0, -1) + toggled;
  }, [input, isAvalanche]);

  const sha256Modified = useMemo(
    () => (isAvalanche ? sha256(encoder.encode(modifiedInput)) : sha256Hash),
    [modifiedInput, isAvalanche, sha256Hash],
  );

  const bitDiff = useMemo(
    () => (isAvalanche ? countBitDifferences(sha256Hash, sha256Modified) : 0),
    [sha256Hash, sha256Modified, isAvalanche],
  );

  function handleRandomInput() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    setHasInteracted(true);
    setInput(bytesToHex(bytes));
  }

  return (
    <ModuleLayout
      moduleKey="hash"
      title="Hash Playground"
      moduleNumber={1}
      subtitle="Type anything on the left. Watch SHA-256 and SHA-256d materialize on the right in real time."
      theoryContent={<TheoryContent />}
      statusText="LIVE UPDATE <100MS"
    >
      {!isAvalanche ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-text-primary md:text-[42px] md:leading-tight">
            A cryptographic fingerprint lab
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="panel-cool rounded-section border border-border p-6">
                <h3 className="text-lg font-bold text-text-primary md:text-[22px]">Input Lab</h3>
                <p className="mb-4 text-sm text-text-muted">Human-readable message</p>

                <label htmlFor="hash-input" className={LABEL}>
                  Input
                </label>
                <textarea
                  id="hash-input"
                  rows={3}
                  value={input}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setInput(e.target.value);
                  }}
                  placeholder="Type anything here..."
                  className={TEXTAREA}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-pill bg-badge-bg px-3 py-1.5 text-sm font-bold text-text-primary">
                    {input.length} chars
                  </span>
                  <span className="rounded-pill bg-badge-bg px-3 py-1.5 text-sm font-bold text-text-primary">
                    {inputBytes.length} bytes
                  </span>
                  <span className="rounded-pill bg-badge-bg px-3 py-1.5 text-sm font-bold text-text-primary">
                    UTF-8 encoded
                  </span>
                </div>
              </div>

              <div className="panel-warm rounded-section border border-border-amber p-6">
                <h3 className="mb-3 text-lg font-bold text-warning-heading">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleRandomInput} className={BTN_PRIMARY}>
                    Random Input
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasInteracted(true);
                      setInput("");
                    }}
                    className={BTN_GHOST}
                  >
                    Empty
                  </button>
                  <button type="button" onClick={() => setMode("avalanche")} className={BTN_GHOST}>
                    Avalanche Demo
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Responsive direction: horizontal on desktop, vertical on mobile */}
              <ValueFlowArrow
                label="SHA-256"
                description="Cryptographic hash: maps any input to a fixed 256-bit output"
                animationKey={sha256Hex}
              />

              <div className="panel-cool rounded-section border border-border p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-text-primary md:text-[22px]">
                    SHA-256 Readout
                  </h3>
                  <span className="rounded-badge border border-[#2F4963] bg-[#142434] px-3 py-1 text-[12px] font-bold text-info">
                    256-BIT OUTPUT
                  </span>
                </div>
                <HexBox value={sha256Hash} label="SHA-256 Hash" variant="info" />
                <span className="mt-2 inline-block rounded-badge bg-[#162233] px-3 py-1 text-[12px] font-bold text-text-secondary">
                  DETERMINISTIC
                </span>
              </div>

              <ValueFlowArrow
                label="SHA-256 again"
                description="Bitcoin double-hashes (SHA-256d) for block headers and TXIDs"
                animationKey={sha256dHex}
              />

              <div className="panel-warm rounded-section border border-border-amber p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-warning-heading md:text-[22px]">
                    SHA-256d Readout
                  </h3>
                  <span className="rounded-badge border border-[#5A3E17] bg-[#2A1D10] px-3 py-1 text-[12px] font-bold text-warning-text">
                    BITCOIN DOUBLE HASH
                  </span>
                </div>
                <HexBox value={sha256dHash} label="SHA-256d (Double Hash)" variant="warm" />
                <span className="mt-2 inline-block rounded-badge bg-[#2A1D10] px-3 py-1 text-[12px] font-bold text-warning-text">
                  ANTI-EXTENSION
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setMode("normal")} className={BTN_GHOST}>
              Back to Normal
            </button>
            <h2 className="text-lg font-bold text-text-primary md:text-2xl">Avalanche Demo</h2>
          </div>

          <p className="text-sm text-text-secondary">
            Flip one bit in the input and watch how the hash changes completely. Red bytes differ,
            teal bytes match.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="panel-cool rounded-input border border-border p-4">
              <label htmlFor="avalanche-original" className={LABEL}>
                Original
              </label>
              <textarea
                id="avalanche-original"
                rows={2}
                value={input}
                onChange={(e) => {
                  setHasInteracted(true);
                  setInput(e.target.value);
                }}
                className={TEXTAREA}
              />
            </div>
            <div className="panel-cool rounded-input border border-border p-4">
              <label htmlFor="avalanche-modified" className={LABEL}>
                Modified
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

          <div className="rounded-section border border-border bg-[#0E1521] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary md:text-[22px]">
                  Avalanche Preview
                </h3>
                <p className="text-sm text-text-muted">
                  One changed character can flip most of the 256 output bits.
                </p>
              </div>
              <div className="rounded-input border border-border-secondary bg-badge-bg px-5 py-3 text-center">
                <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-text-secondary">
                  BITS CHANGED
                </div>
                <div className="font-mono text-2xl font-bold text-accent">
                  <span>{bitDiff}</span>
                  <span className="ml-2 text-sm font-normal text-text-secondary">
                    of 256 bits differ ({((bitDiff / 256) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
            <BitDiffBar original={sha256Hash} modified={sha256Modified} />
          </div>

          <button type="button" onClick={handleRandomInput} className={BTN_PRIMARY}>
            Random Input
          </button>
        </div>
      )}
    </ModuleLayout>
  );
}
