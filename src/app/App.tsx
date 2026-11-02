import { HashRouter } from "react-router-dom";
import { AppShell } from "../components/AppShell/AppShell";
import { ToastProvider } from "../components/Toast/ToastProvider";
import { SettingsProvider } from "./SettingsProvider";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <HashRouter>
      <SettingsProvider>
        <ToastProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </ToastProvider>
      </SettingsProvider>
    </HashRouter>
  );
}
