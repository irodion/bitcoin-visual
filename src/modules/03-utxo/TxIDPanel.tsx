import { HexBox, ValueFlowArrow } from "../../shared/components/index.ts";
import type { TxIDIntermediate } from "./useUTXOState.ts";

interface TxIDPanelProps {
  txidIntermediate: TxIDIntermediate;
  txid: string;
  wtxid: string | null;
  isSegWit: boolean;
}

export function TxIDPanel({ txidIntermediate, txid, wtxid, isSegWit }: TxIDPanelProps) {
  return (
    <div className="panel-cool rounded-section border border-border p-5 md:p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
        TXID Computation
      </div>

      <div className="mx-auto max-w-2xl space-y-2">
        <HexBox
          value={txidIntermediate.serialized}
          label="Serialized TX (legacy)"
          truncate
          maxLength={64}
        />

        <ValueFlowArrow
          label="SHA-256"
          description="Compresses the raw serialized bytes into a fixed 32-byte fingerprint"
          animationKey={txidIntermediate.firstHash}
        />

        <HexBox value={txidIntermediate.firstHash} label="First Hash" variant="info" />

        <ValueFlowArrow
          label="SHA-256"
          description="Second round (SHA-256d) — Bitcoin double-hashes to defend against length-extension attacks"
          animationKey={txidIntermediate.secondHash}
        />

        <HexBox value={txidIntermediate.secondHash} label="Double Hash (SHA-256d)" variant="info" />

        <ValueFlowArrow
          label="Reverse Bytes"
          description="Byte-reverse for display — internally little-endian, displayed big-endian. This trips up every developer"
          animationKey={txid}
        />

        <HexBox value={txid} label="TXID (display order)" variant="success" />

        {isSegWit && wtxid && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-widest text-text-muted">
              Witness TXID (wtxid)
            </div>
            <HexBox value={wtxid} label="WTXID (includes witness data)" variant="warm" />
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              The WTXID is computed from the full SegWit serialization (with witness data). The
              regular TXID always uses legacy serialization, so it remains unchanged regardless of
              witness content. This is how SegWit fixes transaction malleability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
