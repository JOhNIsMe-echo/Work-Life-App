import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, type PropsWithChildren } from "react";
import { repositories } from "../data/repositories";
import { saveStatusStore } from "../data/saveStatus";
import { DEFAULT_PAGE_COLORS } from "../domain/pageColors";
import type { AppSettings } from "../domain/types";
import { SettingsContext, type SettingsContextValue } from "./settings-context";

const fallbackTimestamp = "2000-01-01T00:00:00.000Z";
const fallbackSettings: AppSettings = {
  id: "app",
  createdAt: fallbackTimestamp,
  updatedAt: fallbackTimestamp,
  theme: "system",
  pageColors: { ...DEFAULT_PAGE_COLORS },
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const persistedSettings = useLiveQuery(() => repositories.settings.read(), []);
  const settings = persistedSettings ?? fallbackSettings;

  useEffect(() => {
    void repositories.settings
      .get()
      .then(() => saveStatusStore.markLoaded())
      .catch((error: unknown) => saveStatusStore.markError(error));
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Omit<AppSettings, "id" | "createdAt">>) =>
      repositories.settings.update(patch),
    [],
  );
  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready: persistedSettings !== undefined,
      updateSettings,
    }),
    [persistedSettings, settings, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
