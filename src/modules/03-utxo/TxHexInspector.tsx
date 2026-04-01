import { ByteSegmentTooltip, CopyButton } from "../../shared/components/index.ts";
import type { TxSegment } from "../../shared/crypto/transaction.ts";

interface TxHexInspectorProps {
  serializedHex: string;
  segments: TxSegment[];
  isSegWit: boolean;
  /** Byte indices to highlight as changed (e.g., diffed against another tx). */
  changedBytes?: Set<number>;
}

export function TxHexInspector({
  serializedHex,
  segments,
  isSegWit,
  changedBytes,
}: TxHexInspectorProps) {
  // Each byte = 2 hex chars, so segment byte offsets map to charStart = startByte * 2
  const renderedSegments = segments.map((seg) => {
    const charStart = seg.startByte * 2;
    const charEnd = seg.endByte * 2;
    const hex = serializedHex.slice(charStart, charEnd);
    return { ...seg, hex };
  });

  return (
    <div className="panel-cool rounded-section border border-border p-5 md:p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          Raw Transaction Hex
          {isSegWit && (
            <span className="ml-1.5 rounded-badge bg-purple-400/10 px-2 py-0.5 text-purple-300">
              SegWit
            </span>
          )}
        </div>
        <CopyButton text={serializedHex} />
      </div>
      <div className="mt-2 text-[10px] text-text-muted">
        {serializedHex.length / 2} bytes &mdash; hover segments for details
      </div>

      <div className="mt-3 break-all rounded-inner border border-border bg-surface p-4 font-mono text-sm leading-relaxed">
        {renderedSegments.map((seg) => (
          <ByteSegmentTooltip
            key={`${seg.label}-${seg.startByte}`}
            label={seg.label}
            byteRange={seg.byteRange}
            description={seg.description}
            color={seg.color}
          >
            {changedBytes ? renderWithHighlights(seg.hex, seg.startByte, changedBytes) : seg.hex}
          </ByteSegmentTooltip>
        ))}
      </div>
    </div>
  );
}

/** Render a hex string with changed bytes highlighted inline. */
function renderWithHighlights(hex: string, startByte: number, changedBytes: Set<number>) {
  const elements: React.ReactNode[] = [];
  let run = "";
  let runChanged = false;

  for (let i = 0; i < hex.length; i += 2) {
    const byteIndex = startByte + i / 2;
    const isChanged = changedBytes.has(byteIndex);
    const pair = hex.slice(i, i + 2);

    if (i === 0) {
      runChanged = isChanged;
      run = pair;
      continue;
    }

    if (isChanged === runChanged) {
      run += pair;
    } else {
      elements.push(
        runChanged ? (
          <span key={i} className="rounded-sm bg-danger/25 text-danger">
            {run}
          </span>
        ) : (
          run
        ),
      );
      run = pair;
      runChanged = isChanged;
    }
  }

  if (run) {
    elements.push(
      runChanged ? (
        <span key="last" className="rounded-sm bg-danger/25 text-danger">
          {run}
        </span>
      ) : (
        run
      ),
    );
  }

  return elements;
}
