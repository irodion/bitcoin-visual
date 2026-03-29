import { bytesToHex } from "@noble/hashes/utils.js";
import { extractPubkeysFromScript } from "../../shared/crypto/index.ts";

interface ScriptBreakdownProps {
  redeemScript: Uint8Array;
}

/**
 * Visual annotation of multisig redeem script opcodes.
 * Script format: OP_M <len> <pk1> <len> <pk2> <len> <pk3> OP_N OP_CHECKMULTISIG
 */
export function ScriptBreakdown({ redeemScript }: ScriptBreakdownProps) {
  const m = redeemScript[0] - 0x50;
  const n = redeemScript[redeemScript.length - 2] - 0x50;
  const pubkeys = extractPubkeysFromScript(redeemScript).map(bytesToHex);

  const pkColors = ["text-accent", "text-teal", "text-info"];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] uppercase tracking-widest">
      <span className="rounded-badge border border-border bg-surface-raised px-2 py-0.5 font-mono text-accent">
        OP_{m}
      </span>
      {pubkeys.map((pk, i) => (
        <span
          key={i}
          className={`rounded-badge border border-border bg-surface-raised px-2 py-0.5 font-mono ${pkColors[i] ?? "text-text-secondary"}`}
        >
          &lt;pk{i + 1}&gt; {pk.slice(0, 8)}…
        </span>
      ))}
      <span className="rounded-badge border border-border bg-surface-raised px-2 py-0.5 font-mono text-accent">
        OP_{n}
      </span>
      <span className="rounded-badge border border-border bg-surface-raised px-2 py-0.5 font-mono text-teal">
        OP_CHECKMULTISIG
      </span>
    </div>
  );
}
