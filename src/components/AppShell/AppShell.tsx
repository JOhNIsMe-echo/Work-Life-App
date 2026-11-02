import { Save, Sprout } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { PAGE_DEFINITIONS, pageKeyFromPath } from "../../app/navigation";
import { useSettings } from "../../app/settings-context";
import { Button } from "../Button/Button";
import { useToast } from "../Toast/ToastContext";
import { useSaveStatus } from "../../data/useSaveStatus";
import { readableTextColor } from "../../domain/pageColors";
import styles from "./AppShell.module.css";

const SAVE_LABELS = {
  idle: "等待保存",
  saving: "正在保存",
  saved: "已保存到本机",
  error: "保存失败",
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const activePage = pageKeyFromPath(location.pathname);
  const { settings, ready, updateSettings } = useSettings();
  const { notify } = useToast();
  const [manualSaving, setManualSaving] = useState(false);
  const saveStatus = useSaveStatus();
  const activeColor = settings.pageColors[activePage];
  const shellStyle = {
    "--page-accent": activeColor,
    "--app-accent": activeColor,
    "--app-on-accent": readableTextColor(activeColor),
    "--page-accent-soft": `color-mix(in srgb, ${activeColor} 13%, var(--app-surface))`,
  } as CSSProperties;

  async function manualSave() {
    setManualSaving(true);
    try {
      await updateSettings({
        lastManualSaveAt: new Date().toISOString(),
      });
      try {
        await navigator.storage?.persist?.();
      } catch {
        // Persistence protection is best-effort; the IndexedDB write already succeeded.
      }
      notify("数据已手动保存到本机");
    } catch {
      notify("手动保存失败，请重试");
    } finally {
      setManualSaving(false);
    }
  }

  return (
    <div
      className={styles.themeRoot}
      data-theme={settings.theme}
      data-ready={ready ? "true" : "false"}
      style={shellStyle}
    >
      <div className={styles.appWindow}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <Sprout size={19} />
            </span>
            <div>
              <strong>我的生活</strong>
              <small>只属于我的本地空间</small>
            </div>
          </div>

          <nav className={styles.navigation} aria-label="主要页面">
            {PAGE_DEFINITIONS.map((page) => {
              const Icon = page.icon;
              return (
                <NavLink
                  key={page.key}
                  to={page.path}
                  end={page.path === "/"}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ""}`
                  }
                  style={
                    {
                      "--nav-accent": settings.pageColors[page.key],
                    } as CSSProperties
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{page.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <Button
            variant="quiet"
            className={styles.manualSave}
            disabled={manualSaving}
            onClick={() => void manualSave()}
          >
            <Save size={14} aria-hidden="true" />
            {manualSaving ? "正在保存…" : "保存到本机"}
          </Button>

          <div
            className={`${styles.saveNote} ${saveStatus.status === "error" ? styles.saveError : ""}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.saveDot} aria-hidden="true" />
            <div>
              <strong>{SAVE_LABELS[saveStatus.status]}</strong>
              <small>
                {saveStatus.lastSavedAt
                  ? new Date(saveStatus.lastSavedAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "数据会自动保存"}
              </small>
            </div>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
