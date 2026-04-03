import { CHECK_ICON_PATH, WARNING_ICON_PATH } from "../../../shared/components/styles.ts";

interface AttackResultBadgeProps {
  variant: "compromised" | "protected";
  label: string;
}

const styles = {
  compromised: {
    container: "border-danger/30 bg-danger/10 text-danger",
    icon: WARNING_ICON_PATH,
  },
  protected: {
    container: "border-success/30 bg-success/10 text-success",
    icon: CHECK_ICON_PATH,
  },
} as const;

export function AttackResultBadge({ variant, label }: AttackResultBadgeProps) {
  const s = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm font-semibold ${s.container}`}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d={s.icon} clipRule="evenodd" />
      </svg>
      {label}
    </span>
  );
}
