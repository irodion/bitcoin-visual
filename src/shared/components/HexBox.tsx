import { useId, useState, useMemo } from "react";
import { bytesToHex } from "@noble/hashes/utils.js";
import { CopyButton } from "./CopyButton";

interface HexBoxProps {
  value: string | Uint8Array;
  label?: string;
  variant?: "default" | "danger" | "info" | "success";
  truncate?: boolean;
  maxLength?: number;
}

const variantColors = {
  default: "text-accent",
  danger: "text-danger",
  info: "text-info",
  success: "text-success",
} as const;

const variantGlow = {
  default: "shadow-[inset_0_0_20px_rgba(245,158,11,0.04)]",
  danger: "shadow-[inset_0_0_20px_rgba(239,68,68,0.04)]",
  info: "shadow-[inset_0_0_20px_rgba(59,130,246,0.04)]",
  success: "shadow-[inset_0_0_20px_rgba(34,197,94,0.04)]",
} as const;

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
  const displayHex = shouldTruncate ? hex.slice(0, maxLength) + "…" : hex;

  return (
    <div
      className={`group/hex relative rounded-card border border-border bg-surface-raised p-3 transition-colors hover:border-border-strong ${variantGlow[variant]}`}
    >
      {label && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-text-secondary">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              variant === "default"
                ? "bg-accent"
                : variant === "danger"
                  ? "bg-danger"
                  : variant === "info"
                    ? "bg-info"
                    : "bg-success"
            }`}
          />
          {label}
        </div>
      )}
      <div id={contentId} className="pr-8">
        <code
          className={`break-all font-mono text-sm leading-relaxed tracking-wide ${variantColors[variant]}`}
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
      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover/hex:opacity-100 group-focus-within/hex:opacity-100">
        <CopyButton text={hex} />
      </div>
    </div>
  );
}
