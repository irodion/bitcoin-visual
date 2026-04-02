import { useState } from "react";
import { SECTION_LABEL } from "../../../shared/components/styles.ts";

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19];
const KNOWN_H = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

function computeFrac32(p: number): number {
  const sqrtP = Math.sqrt(p);
  const frac = sqrtP - Math.floor(sqrtP);
  return (frac * 2 ** 32) >>> 0;
}

interface NUMSConstantsPanelProps {
  onInteract: () => void;
}

export function NUMSConstantsPanel({ onInteract }: NUMSConstantsPanelProps) {
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [computed, setComputed] = useState<number[]>([]);

  function handleVerify() {
    onInteract();
    const results = PRIMES.map(computeFrac32);
    setComputed(results);
    setVerified(true);
  }

  return (
    <section className="rounded-section border border-border bg-[#0C1219]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left md:px-6"
        aria-expanded={open}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-accent transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
        <span className={SECTION_LABEL}>"Nothing Up My Sleeve" Constants</span>
        <span className="ml-auto text-xs text-text-secondary">
          {open ? "Collapse" : "Where do SHA-256's magic numbers come from?"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-5 pb-6 pt-5 md:px-6">
          <p className="text-sm text-text-secondary">
            SHA-256's eight initial hash values (H₀–H₇) are the first 32 bits of the fractional
            parts of the square roots of the first 8 prime numbers. This transparency proves no
            hidden backdoor was planted in the constants.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                  <th className="pb-2 pr-4">Index</th>
                  <th className="pb-2 pr-4">Prime</th>
                  <th className="pb-2 pr-4">Formula</th>
                  <th className="pb-2 pr-4">H value</th>
                  {verified && <th className="pb-2 pr-4">Computed</th>}
                  {verified && <th className="pb-2">Match</th>}
                </tr>
              </thead>
              <tbody>
                {PRIMES.map((p, i) => {
                  const match = verified && computed[i] === KNOWN_H[i];
                  return (
                    <tr key={p} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-text-muted">H{i}</td>
                      <td className="py-2 pr-4 font-mono text-accent">{p}</td>
                      <td className="py-2 pr-4 text-text-secondary">frac(√{p}) × 2³²</td>
                      <td className="py-2 pr-4 font-mono text-text-primary">
                        {KNOWN_H[i].toString(16).padStart(8, "0")}
                      </td>
                      {verified && (
                        <td className="py-2 pr-4 font-mono text-text-primary">
                          {computed[i].toString(16).padStart(8, "0")}
                        </td>
                      )}
                      {verified && (
                        <td className="py-2">
                          {match ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-danger" title="Floating-point precision limit">
                              ≈
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!verified && (
            <button
              type="button"
              onClick={handleVerify}
              className="cursor-pointer text-sm font-medium text-accent hover:underline"
            >
              Verify with your browser →
            </button>
          )}

          {verified && (
            <p className="text-xs text-success">
              {computed.filter((c, i) => c === KNOWN_H[i]).length} of 8 constants verified.
              {computed.some((c, i) => c !== KNOWN_H[i]) &&
                " Some may differ by ±1 due to floating-point precision limits in JavaScript's Math.sqrt."}
            </p>
          )}

          <div className="rounded-callout border border-warning-border bg-warning-bg p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-warning-text">
              CONTRAST: DUAL_EC_DRBG
            </div>
            <p className="mt-1 text-sm text-warning-body">
              The NSA's Dual_EC_DRBG random number generator used unexplained constants that were
              later revealed to contain a backdoor (Snowden, 2013). Transparent "nothing up my
              sleeve" derivation prevents this class of attack.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
