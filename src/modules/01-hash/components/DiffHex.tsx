import { useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";

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
            {p.differs && <span aria-hidden="true">·</span>}
            {p[charKey]}
            <span className="sr-only">{p.differs ? " differs" : " matches"}</span>
          </span>
        ))}
      </code>
    </div>
  );
}

export function DiffHex({ original, modified }: { original: Uint8Array; modified: Uint8Array }) {
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
