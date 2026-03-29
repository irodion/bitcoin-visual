import type { ReactNode } from "react";
import { BTN_PRIMARY } from "../../shared/components/styles.ts";

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
  active: "bg-accent text-[#111723]",
  complete: "bg-success text-[#111723]",
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
    <div className={`panel-cool rounded-[24px] border p-5 transition-all ${statusStyles[status]}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${circleBg[status]}`}
        >
          {status === "complete" ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
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
