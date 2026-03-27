import type { ReactNode } from "react";

interface ByteSegmentTooltipProps {
  label: string;
  byteRange: string;
  description: string;
  color: string;
  children: ReactNode;
}

export function ByteSegmentTooltip({
  label,
  byteRange,
  description,
  color,
  children,
}: ByteSegmentTooltipProps) {
  return (
    <span tabIndex={0} className={`group/seg relative inline cursor-help ${color}`}>
      <span className="rounded-sm transition-colors group-hover/seg:bg-white/5 group-focus/seg:bg-white/5">
        {children}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 hidden w-max max-w-xs -translate-x-1/2 rounded-card border border-border-strong bg-surface-raised px-3 py-2 text-left shadow-lg group-hover/seg:block group-focus/seg:block">
        <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border-strong bg-surface-raised" />
        <span className="block font-mono text-xs font-semibold text-accent">{label}</span>
        <span className="mt-0.5 block font-mono text-[10px] text-text-secondary">{byteRange}</span>
        <span className="mt-1 block text-xs leading-relaxed text-text-primary">{description}</span>
      </span>
    </span>
  );
}
