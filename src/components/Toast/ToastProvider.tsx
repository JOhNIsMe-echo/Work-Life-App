import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ToastContext, type ToastAction, type ToastContextValue } from "./ToastContext";
import styles from "./ToastProvider.module.css";

type ToastState = {
  message: string;
  action?: ToastAction;
} | null;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>(null);
  const dismissTimer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearTimer();
    dismissTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, [clearTimer]);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const notify = useCallback(
    (message: string) => {
      setToast({ message });
      scheduleDismiss();
    },
    [scheduleDismiss],
  );

  const notifyUndo = useCallback(
    (message: string, action: ToastAction) => {
      setToast({ message, action });
      scheduleDismiss();
    },
    [scheduleDismiss],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const value = useMemo<ToastContextValue>(
    () => ({ notify, notifyUndo, dismiss }),
    [dismiss, notify, notifyUndo],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                void toast.action?.onAction();
                dismiss();
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.close}
            aria-label="关闭提示"
            onClick={dismiss}
          >
            ×
          </button>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
