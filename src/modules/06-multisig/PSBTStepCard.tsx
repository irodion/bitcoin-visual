import type { ReactNode } from "react";
import { BTN_PRIMARY, CHECK_ICON_PATH } from "../../shared/components/styles.ts";

type StepStatus = "pending" | "active" | "complete";

interface PSBTStepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  status: StepStatus;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

const statusStyles: Record<StepStatus, string> = {
  pending: "opacity-50 border-border",
  active: "border-accent/40",
  complete: "border-success/40",
};

const circleBg: Record<StepStatus, string> = {
  pending: "bg-surface-raised text-text-muted",
  active: "bg-accent text-text-on-accent",
  complete: "bg-success text-text-on-accent",
};

export function PSBTStepCard({
  stepNumber,
  title,
  description,
  status,
  actionLabel,
  onAction,
  children,
}: PSBTStepCardProps) {
  return (
    <div className={`panel-cool rounded-input border p-5 transition-all ${statusStyles[status]}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${circleBg[status]}`}
        >
          {status === "complete" ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d={CHECK_ICON_PATH} />
            </svg>
          ) : (
            stepNumber
          )}
        </span>
        <span className="text-sm font-bold text-text-primary">{title}</span>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-text-secondary">{description}</p>

      {status === "active" && actionLabel && onAction && (
        <button type="button" className={BTN_PRIMARY} onClick={onAction}>
          {actionLabel}
        </button>
      )}

      {(status === "active" || status === "complete") && children && (
        <div className="mt-4 space-y-3">{children}</div>
      )}
    </div>
  );
}
