import { useSyncExternalStore } from "react";
import { saveStatusStore, type SaveSnapshot } from "./saveStatus";

export function useSaveStatus(): SaveSnapshot {
  return useSyncExternalStore(
    saveStatusStore.subscribe,
    saveStatusStore.getSnapshot,
    saveStatusStore.getSnapshot,
  );
}
