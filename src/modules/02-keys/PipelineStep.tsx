import type { ReactNode } from "react";
import { HexBox } from "../../shared/components/index.ts";

interface PipelineStepProps {
  stepNumber: number;
  title: string;
  algorithm: string;
  algorithmDetail: string;
  value: string | Uint8Array | null;
  hexVariant?: "default" | "danger" | "info" | "success";
  overlay?: ReactNode;
}

export function PipelineStep({
  stepNumber,
  title,
  algorithm,
  algorithmDetail,
  value,
  hexVariant = "default",
  overlay,
}: PipelineStepProps) {
  return (
    <div className="panel-cool rounded-[24px] border border-border p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {stepNumber}
        </span>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <span className="group relative" tabIndex={0}>
          <span className="rounded-badge bg-[#171E2C] px-2.5 py-1 font-mono text-[11px] text-text-secondary">
            {algorithm}
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-xl border border-border bg-surface-raised p-2.5 text-xs text-text-secondary shadow-lg group-hover:block group-focus-within:block">
            {algorithmDetail}
          </span>
        </span>
      </div>

      {overlay}

      {value === null ? (
        <p className="py-3 text-center text-sm italic text-text-secondary/30">
          Waiting for entropy...
        </p>
      ) : (
        <HexBox value={value} label={title} variant={hexVariant} />
      )}
    </div>
  );
}
