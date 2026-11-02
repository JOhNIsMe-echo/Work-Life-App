import { createContext, useContext } from "react";
import type { AppSettings } from "../domain/types";

export type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (
    patch: Partial<Omit<AppSettings, "id" | "createdAt">>,
  ) => Promise<AppSettings>;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return context;
}
