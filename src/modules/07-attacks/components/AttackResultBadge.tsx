import { CHECK_ICON_PATH } from "../../../shared/components/styles.ts";

interface AttackResultBadgeProps {
  variant: "compromised" | "protected";
  label: string;
}

const WARNING_ICON_PATH =
  "M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z";

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
