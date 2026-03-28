import { useId, useState, useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { CopyButton } from "./CopyButton";

type HexVariant = "default" | "danger" | "info" | "success" | "warm";

interface HexBoxProps {
  value: string | Uint8Array;
  label?: string;
  variant?: HexVariant;
  truncate?: boolean;
  maxLength?: number;
}

const variantColors = {
  default: "text-accent",
  danger: "text-danger",
  info: "text-info",
  success: "text-success",
  warm: "text-warning-heading",
} as const;

const variantGlow = {
  default: "shadow-[inset_0_0_20px_rgba(247,147,26,0.04)]",
  danger: "shadow-[inset_0_0_20px_rgba(255,107,107,0.04)]",
  info: "shadow-[inset_0_0_20px_rgba(125,211,252,0.04)]",
  success: "shadow-[inset_0_0_20px_rgba(34,197,94,0.04)]",
  warm: "shadow-[inset_0_0_20px_rgba(247,147,26,0.06)]",
} as const;

const variantDot = {
  default: "bg-accent",
  danger: "bg-danger",
  info: "bg-info",
  success: "bg-success",
  warm: "bg-warning-text",
} as const;

const DEFAULT_BORDER = "border-border hover:border-border-strong";
const variantBorder: Partial<Record<HexVariant, string>> = {
  warm: "border-border-amber hover:border-border-amber",
};

export function HexBox({
  value,
  label,
  variant = "default",
  truncate = false,
  maxLength = 64,
}: HexBoxProps) {
  const contentId = useId();
  const [expanded, setExpanded] = useState(false);

  const hex = useMemo(() => (value instanceof Uint8Array ? bytesToHex(value) : value), [value]);
  const shouldTruncate = truncate && !expanded && hex.length > maxLength;
  const displayHex = shouldTruncate ? hex.slice(0, maxLength) + "\u2026" : hex;

  return (
    <div
      className={`group/hex relative rounded-card border bg-surface-raised p-4 transition-colors ${variantBorder[variant] ?? DEFAULT_BORDER} ${variantGlow[variant]}`}
    >
      {label && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${variantDot[variant]}`} />
          {label}
        </div>
      )}
      <div id={contentId} className="pr-8">
        <code
          className={`break-all font-mono text-sm leading-relaxed tracking-wide md:text-base ${variantColors[variant]}`}
        >
          {displayHex}
        </code>
        {truncate && hex.length > maxLength && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-controls={contentId}
            className="ml-2 cursor-pointer rounded px-1.5 py-0.5 text-[11px] text-text-secondary transition-colors hover:bg-border hover:text-accent"
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </div>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/hex:opacity-100 group-focus-within/hex:opacity-100">
        <CopyButton text={hex} />
      </div>
    </div>
  );
}
