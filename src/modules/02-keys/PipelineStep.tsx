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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {stepNumber}
        </span>
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <span className="group relative">
          <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] text-text-secondary">
            {algorithm}
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-card border border-border bg-surface-raised p-2 text-xs text-text-secondary shadow-lg group-hover:block">
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
