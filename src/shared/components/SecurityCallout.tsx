import type { ReactNode } from "react";

interface SecurityCalloutProps {
  children: ReactNode;
  variant?: "danger" | "warning";
}

const variantStyles = {
  danger: "border-danger/60 bg-danger/5",
  warning: "border-warning-border bg-warning-bg",
} as const;

const iconColors = {
  danger: "text-danger",
  warning: "text-warning-text",
} as const;

export function SecurityCallout({ children, variant = "danger" }: SecurityCalloutProps) {
  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-callout border py-3 pl-4 pr-4 ${variantStyles[variant]}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`mt-0.5 shrink-0 ${iconColors[variant]}`}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <div className="text-sm leading-relaxed text-text-primary">{children}</div>
    </div>
  );
}
