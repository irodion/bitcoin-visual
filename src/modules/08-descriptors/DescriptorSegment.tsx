import type { DescriptorSegmentInfo, SegmentKind } from "../../shared/crypto/index.ts";

const KIND_COLORS: Record<SegmentKind, string> = {
  function: "text-accent",
  origin: "text-text-muted",
  fingerprint: "text-teal-400",
  originPath: "text-teal-300",
  key: "text-info",
  suffix: "text-success",
  checksum: "text-text-muted",
  separator: "text-text-secondary",
  threshold: "text-warning-text",
};

const KIND_LABELS: Record<SegmentKind, string> = {
  function: "Script type function",
  origin: "Key origin bracket",
  fingerprint: "Master key fingerprint",
  originPath: "Derivation path segment",
  key: "Extended public key",
  suffix: "Derivation suffix",
  checksum: "Error-detecting checksum",
  separator: "Separator",
  threshold: "Signing threshold",
};

interface DescriptorSegmentProps {
  segment: DescriptorSegmentInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function DescriptorSegment({ segment, isSelected, onClick }: DescriptorSegmentProps) {
  const colorClass = KIND_COLORS[segment.kind] ?? "text-text-primary";
  const label = KIND_LABELS[segment.kind] ?? segment.kind;

  // Separators are not interactive
  if (segment.kind === "separator") {
    return <span className={`${colorClass} font-mono`}>{segment.text}</span>;
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${label}: ${segment.text}`}
      className={`${colorClass} cursor-pointer font-mono transition-all duration-150 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        isSelected ? "rounded bg-surface-raised ring-1 ring-accent/50 px-0.5" : "hover:underline"
      }`}
    >
      {segment.text}
    </span>
  );
}
