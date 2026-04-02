import { useRef, useEffect, useId } from "react";
import { BTN_PRIMARY, BTN_DANGER, BTN_GHOST } from "./styles.ts";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const closingRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      closingRef.current = true;
      dialog.close();
      closingRef.current = false;
    }
  }, [open]);

  function handleClose() {
    if (closingRef.current) return;
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-w-md rounded-card border border-border-strong bg-surface p-6 text-text-primary backdrop:bg-black/50"
      onClose={handleClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <h2 id={titleId} className="mb-2 text-lg font-bold">
        {title}
      </h2>
      <p id={descId} className="mb-6 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_GHOST} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={variant === "danger" ? BTN_DANGER : BTN_PRIMARY}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
