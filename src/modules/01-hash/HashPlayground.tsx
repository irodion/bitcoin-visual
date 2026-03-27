import { useState, useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256, sha256d } from "../../shared/crypto/index.ts";
import { ModuleLayout, HexBox, ValueFlowArrow } from "../../shared/components/index.ts";

const encoder = new TextEncoder();

const BTN =
  "cursor-pointer rounded-card border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent";
const TEXTAREA =
  "w-full resize-y rounded-input border border-border bg-surface-raised px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none";
const LABEL = "mb-2 block text-[11px] font-medium uppercase tracking-widest text-text-secondary";

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
      <div className="rounded-card border border-border bg-surface-raised p-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Original Hash
        </div>
        <code className="break-all font-mono text-sm leading-relaxed tracking-wide">
          {pairs.map((p, i) => (
            <span
              key={i}
              className={p.differs ? "rounded-sm bg-danger/10 text-danger" : "text-success"}
            >
              {p.differs && <span aria-hidden="true">·</span>}
              {p.orig}
              <span className="sr-only">{p.differs ? " differs" : " matches"}</span>
            </span>
          ))}
        </code>
      </div>
      <div className="rounded-card border border-border bg-surface-raised p-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Modified Hash
        </div>
        <code className="break-all font-mono text-sm leading-relaxed tracking-wide">
          {pairs.map((p, i) => (
            <span
              key={i}
              className={p.differs ? "rounded-sm bg-danger/10 text-danger" : "text-success"}
            >
              {p.differs && <span aria-hidden="true">·</span>}
              {p.mod}
              <span className="sr-only">{p.differs ? " differs" : " matches"}</span>
            </span>
          ))}
        </code>
      </div>
    </div>
  );
}

function TheoryContent() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <h3>What is SHA-256?</h3>
      <p>
        SHA-256 is a cryptographic hash function that maps any input to a fixed{" "}
        <strong>256-bit (32-byte)</strong> output. Bitcoin uses it everywhere: block header hashing,
        transaction IDs (TXIDs), and address derivation via <code>HASH160</code> (SHA-256 followed
        by RIPEMD-160).
      </p>

      <h3>Properties</h3>
      <p>
        <strong>Deterministic</strong> — the same input always produces the same hash. No randomness
        involved.
      </p>
      <p>
        <strong>Avalanche effect</strong> — changing even a single bit of input produces a
        completely different hash. Try the Avalanche Demo to see this in action.
      </p>
      <p>
        <strong>One-way</strong> — given a hash output, it is computationally infeasible to find the
        original input. This is what makes proof-of-work hard.
      </p>
      <p>
        <strong>Fixed length</strong> — output is always 64 hex characters (256 bits), whether the
        input is 1 byte or 1 gigabyte.
      </p>

      <h3>Why double-hash?</h3>
      <p>
        Bitcoin uses <code>SHA-256d</code> — SHA-256 applied twice — for block headers and TXIDs.
      </p>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mb-2 cursor-pointer text-xs font-medium text-accent hover:underline"
      >
        {expanded ? "Hide details" : "Why not just once?"}
      </button>
      {expanded && (
        <p>
          Double-hashing guards against <strong>length-extension attacks</strong>. With a single
          SHA-256, an attacker who knows <code>H(m)</code> can compute{" "}
          <code>H(m || padding || extra)</code> without knowing <code>m</code>. Applying SHA-256 a
          second time breaks this attack because the second hash takes a fixed-length input (the
          first hash&apos;s output), not the original variable-length message.
        </p>
      )}
    </>
  );
}

export default function HashPlayground() {
  const [input, setInput] = useState("Hello, Bitcoin!");
  const [mode, setMode] = useState<"normal" | "avalanche">("normal");

  const inputBytes = useMemo(() => encoder.encode(input), [input]);
  const sha256Hash = useMemo(() => sha256(inputBytes), [inputBytes]);
  const sha256dHash = useMemo(() => sha256d(inputBytes), [inputBytes]);

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
    setInput(bytesToHex(bytes));
  }

  return (
    <ModuleLayout moduleKey="hash" title="Hash Playground" theoryContent={<TheoryContent />}>
      <div className="mx-auto max-w-2xl space-y-2">
        {!isAvalanche ? (
          <>
            <div>
              <label htmlFor="hash-input" className={LABEL}>
                Input
              </label>
              <textarea
                id="hash-input"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type anything here..."
                className={TEXTAREA}
              />
            </div>

            <ValueFlowArrow
              label="SHA-256"
              description="Cryptographic hash: maps any input to a fixed 256-bit output"
              animationKey={bytesToHex(sha256Hash)}
            />

            <HexBox value={sha256Hash} label="SHA-256 Hash" variant="info" />

            <ValueFlowArrow
              label="SHA-256 again"
              description="Bitcoin double-hashes (SHA-256d) for block headers and TXIDs"
              animationKey={bytesToHex(sha256dHash)}
            />

            <HexBox value={sha256dHash} label="SHA-256d (Double Hash)" variant="success" />

            <div className="flex flex-wrap gap-3 pt-4">
              <button type="button" onClick={handleRandomInput} className={BTN}>
                Random Input
              </button>
              <button
                type="button"
                onClick={() => setMode("avalanche")}
                className="cursor-pointer rounded-card border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Avalanche Demo
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMode("normal")} className={BTN}>
                Back to Normal
              </button>
              <h2 className="text-sm font-medium text-text-primary">Avalanche Demo</h2>
            </div>

            <p className="text-sm text-text-secondary">
              Flip one bit in the input and watch how the hash changes completely. Red bytes differ,
              green bytes match.
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="avalanche-original" className={LABEL}>
                  Original
                </label>
                <textarea
                  id="avalanche-original"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={TEXTAREA}
                />
              </div>
              <div>
                <label htmlFor="avalanche-modified" className={LABEL}>
                  Modified
                </label>
                <textarea
                  id="avalanche-modified"
                  rows={2}
                  value={modifiedInput}
                  readOnly
                  className="w-full resize-y rounded-input border border-border bg-surface-raised px-4 py-3 font-mono text-sm text-text-secondary placeholder:text-text-secondary/50"
                />
              </div>
            </div>

            <DiffHex original={sha256Hash} modified={sha256Modified} />

            <div className="rounded-card border border-border bg-surface p-4 text-center">
              <span className="font-mono text-2xl font-bold text-accent">{bitDiff}</span>
              <span className="ml-2 text-sm text-text-secondary">
                of 256 bits differ ({((bitDiff / 256) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={handleRandomInput} className={BTN}>
                Random Input
              </button>
            </div>
          </>
        )}
      </div>
    </ModuleLayout>
  );
}
