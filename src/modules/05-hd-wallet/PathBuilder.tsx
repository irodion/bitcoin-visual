import { HexBox, SecurityCallout } from "../../shared/components/index.ts";
import type { PathSegment, DerivedTree } from "./useHDState.ts";

const SEGMENT_META = [
  {
    name: "Purpose",
    explanation:
      "BIP84 uses 84' for native SegWit (P2WPKH) addresses. BIP44 uses 44' for legacy P2PKH.",
    canHarden: true,
  },
  {
    name: "Coin Type",
    explanation: "0' = Bitcoin mainnet, 1' = testnet. Registered in SLIP-44.",
    canHarden: true,
  },
  {
    name: "Account",
    explanation:
      "Allows separate accounts under one seed. Hardened so that one account's xpub cannot leak siblings.",
    canHarden: true,
  },
  {
    name: "Change",
    explanation:
      "0 = external (receiving) addresses, 1 = internal (change) addresses. Not hardened by BIP44 spec.",
    canHarden: false,
  },
  {
    name: "Index",
    explanation:
      "Address index within the chain. Increment to generate new receiving or change addresses.",
    canHarden: false,
  },
];

interface PathBuilderProps {
  pathSegments: PathSegment[];
  updatePathSegment: (i: number, update: Partial<PathSegment>) => void;
  selectedSegmentIndex: number | null;
  setSelectedSegmentIndex: (i: number | null) => void;
  derivedTree: DerivedTree | null;
  fullPathString: string;
}

export function PathBuilder({
  pathSegments,
  updatePathSegment,
  selectedSegmentIndex,
  setSelectedSegmentIndex,
  derivedTree,
  fullPathString,
}: PathBuilderProps) {
  return (
    <div className="panel-warm rounded-section border border-border-amber p-6">
      <h3 className="mb-1 text-lg font-bold text-text-primary">Derivation Path</h3>
      <p className="mb-4 text-sm text-text-muted">
        Click a segment to learn what it controls. The full BIP44 path is shown below.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-1">
        <span className="rounded-badge bg-surface-raised px-2.5 py-1 font-mono text-sm font-bold text-text-primary">
          m
        </span>
        {pathSegments.map((seg, i) => {
          const meta = SEGMENT_META[i];
          const isSelected = selectedSegmentIndex === i;
          return (
            <div key={i} className="flex items-center gap-1">
              <span className="text-text-muted">/</span>
              <button
                type="button"
                onClick={() => setSelectedSegmentIndex(isSelected ? null : i)}
                className={`rounded-badge px-2.5 py-1 font-mono text-sm font-bold transition-colors ${
                  isSelected
                    ? "border border-accent bg-accent/10 text-accent"
                    : "border border-border bg-surface-raised text-text-primary hover:border-border-strong"
                }`}
              >
                {seg.index}
                {seg.hardened ? "'" : ""}
              </button>
              {meta.canHarden && (
                <button
                  type="button"
                  onClick={() => updatePathSegment(i, { hardened: !seg.hardened })}
                  title={seg.hardened ? "Switch to normal" : "Switch to hardened"}
                  className={`h-6 w-6 rounded-full text-[10px] font-bold transition-colors ${
                    seg.hardened
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-raised text-text-muted hover:text-text-primary"
                  }`}
                >
                  '
                </button>
              )}
              {i === pathSegments.length - 1 && (
                <div className="ml-1 flex flex-col">
                  <button
                    type="button"
                    onClick={() =>
                      updatePathSegment(i, { index: Math.min(seg.index + 1, 2147483647) })
                    }
                    className="text-[10px] leading-none text-text-muted hover:text-accent"
                    aria-label="Increment index"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePathSegment(i, { index: Math.max(seg.index - 1, 0) })}
                    className="text-[10px] leading-none text-text-muted hover:text-accent"
                    aria-label="Decrement index"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mb-4 font-mono text-xs text-text-secondary">{fullPathString}</p>

      {selectedSegmentIndex !== null && (
        <div className="mb-4 rounded-callout border border-border bg-surface-raised p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-accent">
            {SEGMENT_META[selectedSegmentIndex].name}
          </p>
          <p className="text-sm text-text-secondary">
            {SEGMENT_META[selectedSegmentIndex].explanation}
          </p>
        </div>
      )}

      {derivedTree && (
        <div className="space-y-3">
          <HexBox
            value={derivedTree.accountXpub}
            label="Account xpub (m/84'/0'/0')"
            variant="info"
            truncate
          />
          <SecurityCallout variant="warning">
            If an attacker obtains your account xpub and any single non-hardened child private key,
            they can compute the parent private key and derive all sibling private keys. This is why
            account-level derivation is hardened.
          </SecurityCallout>
        </div>
      )}
    </div>
  );
}
