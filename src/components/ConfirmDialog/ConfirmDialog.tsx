import { TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "取消",
  destructive = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.layer}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="关闭确认框"
        onClick={onCancel}
      />
      <section className={styles.dialog}>
        <span className={styles.icon} aria-hidden="true">
          <TriangleAlert size={20} />
        </span>
        <div>
          <h2 id="confirm-title">{title}</h2>
          <p id="confirm-description">{description}</p>
        </div>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            className={styles.secondary}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? styles.danger : styles.primary}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
