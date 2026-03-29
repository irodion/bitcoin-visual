import { useState } from "react";
import { HexBox } from "../../shared/components/index.ts";
import type { SighashDetail as SighashDetailType } from "../../shared/crypto/index.ts";

interface SighashDetailProps {
  details: SighashDetailType;
}

export function SighashDetail({ details }: SighashDetailProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-callout border border-border bg-surface p-4">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full cursor-pointer items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-text-secondary transition-colors hover:text-accent"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M3 1l4 4-4 4" />
        </svg>
        {expanded ? "Hide sighash details" : "Show sighash details"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <HexBox
            value={details.hashPrevouts}
            label="hashPrevouts — SHA256d of all outpoints"
            variant="info"
          />
          <HexBox
            value={details.hashSequence}
            label="hashSequence — SHA256d of all sequences"
            variant="info"
          />
          <HexBox
            value={details.hashOutputs}
            label="hashOutputs — SHA256d of all outputs"
            variant="info"
          />
          <HexBox
            value={details.preimage}
            label="BIP143 Preimage (full)"
            variant="warm"
            truncate
            maxLength={80}
          />
          <HexBox value={details.sighash} label="Sighash — SHA256d of preimage" variant="danger" />
        </div>
      )}
    </div>
  );
}
