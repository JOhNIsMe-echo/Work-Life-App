import { X } from "lucide-react";
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from "react";
import styles from "./EditDrawer.module.css";

type EditDrawerProps = PropsWithChildren<{
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  footer?: ReactNode;
}>;

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const INITIAL_FOCUS_SELECTOR =
  "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [data-autofocus]";

export function EditDrawer({
  open,
  title,
  eyebrow = "编辑记录",
  onClose,
  footer,
  children,
}: EditDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const firstField =
      panel?.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR) ??
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstField?.focus();

    return () => {
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.layer}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="关闭编辑面板"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }

          if (event.key !== "Tab") {
            return;
          }

          const focusable = [
            ...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
              []),
          ];
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <header className={styles.header}>
          <div>
            <span>{eyebrow}</span>
            <h2 id="drawer-title">{title}</h2>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="关闭"
            onClick={onClose}
          >
            <X aria-hidden="true" size={17} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </aside>
    </div>
  );
}
