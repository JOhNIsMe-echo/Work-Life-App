import { createContext, useContext } from "react";

export type ToastAction = {
  label: string;
  onAction: () => void | Promise<void>;
};

export type ToastContextValue = {
  notify: (message: string) => void;
  notifyUndo: (message: string, action: ToastAction) => void;
  dismiss: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
