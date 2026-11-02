import { useLiveQuery } from "dexie-react-hooks";
import {
  Database,
  Download,
  HardDrive,
  RotateCcw,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { useSettings } from "../../app/settings-context";
import { db } from "../../data/db";
import { repositories } from "../../data/repositories";
import { PAGE_KEYS, PAGE_LABELS, DEFAULT_PAGE_COLORS } from "../../domain/pageColors";
import type { BackupFile } from "../../lib/backup";
import {
  backupFileName,
  browseBackup,
  createBackup,
  downloadJsonFile,
  parseBackup,
  readAllData,
  replaceAllData,
} from "../../lib/backup";
import type { PageKey, ThemeMode } from "../../domain/types";
import { ClearDataDialog } from "./ClearDataDialog";
import styles from "./SettingsPage.module.css";

const THEME_LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

const COUNT_LABELS = {
  todos: "今日待办",
  memos: "快速备忘",
  fitnessEntries: "健身记录",
  dietEntries: "饮食记录",
  entertainmentItems: "娱乐项目",
  studyEntries: "学习记录",
  moodEntries: "心情记录",
} as const;

export function SettingsDashboard() {
  const { notify } = useToast();
  const { settings, updateSettings } = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [backupPreview, setBackupPreview] = useState<BackupFile | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const data = useLiveQuery(() => readAllData(db), []);
  const counts = data
    ? {
        todos: data.todos.length,
        memos: data.memos.length,
        fitnessEntries: data.fitnessEntries.length,
        dietEntries: data.dietEntries.length,
        entertainmentItems: data.entertainmentItems.length,
        studyEntries: data.studyEntries.length,
        moodEntries: data.moodEntries.length,
      }
    : {
        todos: 0,
        memos: 0,
        fitnessEntries: 0,
        dietEntries: 0,
        entertainmentItems: 0,
        studyEntries: 0,
        moodEntries: 0,
      };

  async function changeTheme(theme: ThemeMode) {
    try {
      await updateSettings({ theme });
      notify(`已切换为${THEME_LABELS[theme]}外观`);
    } catch {
      notify("外观保存失败，请重试");
    }
  }

  async function changeColor(page: PageKey, color: string) {
    try {
      await updateSettings({
        pageColors: { ...settings.pageColors, [page]: color },
      });
    } catch {
      notify("页面颜色保存失败，请重试");
    }
  }

  async function resetColors() {
    try {
      await updateSettings({ pageColors: { ...DEFAULT_PAGE_COLORS } });
      notify("八页颜色已恢复默认");
    } catch {
      notify("颜色恢复失败，请重试");
    }
  }

  async function exportBackup() {
    try {
      const allData = await readAllData(db);
      const backup = createBackup(allData);
      downloadJsonFile(JSON.stringify(backup, null, 2), backupFileName());
      await repositories.settings.update({
        lastBackupAt: new Date().toISOString(),
      });
      notify("备份文件已导出");
    } catch {
      notify("导出失败，请重试");
    }
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setError("");
    try {
      const text = await file.text();
      setBackupPreview(parseBackup(text));
    } catch (cause) {
      setBackupPreview(null);
      setError(cause instanceof Error ? cause.message : "无法读取这个备份文件。");
    }
  }

  async function restoreBackup() {
    if (!backupPreview) {
      return;
    }
    setImporting(true);
    setError("");
    try {
      await replaceAllData(db, backupPreview.data);
      setBackupPreview(null);
      notify("备份已恢复，当前页面已同步更新");
    } catch {
      setError("恢复失败，当前数据未被更改。");
      setBackupPreview(null);
    } finally {
      setImporting(false);
    }
  }

  const previewCounts = backupPreview ? browseBackup(backupPreview) : null;

  return (
    <>
      <PageHeader
        eyebrow="所有内容都保存在当前浏览器"
        title="数据与设置"
        description="管理本地备份、恢复、外观和八个页面的独立颜色。"
      />

      <div className={styles.statusCard}>
        <span className={styles.statusIcon}>
          <HardDrive size={19} aria-hidden="true" />
        </span>
        <div>
          <span>本地数据状态</span>
          <strong>IndexedDB · 自动保存已启用</strong>
          <p>不需要登录，也不会把记录上传到网络。</p>
        </div>
        <span className={styles.goodPill}>本机</span>
      </div>

      <div className={styles.dataGrid}>
        <article className={styles.card}>
          <div className={styles.sectionHead}>
            <div>
              <span>数据概况</span>
              <h2>这里记录了多少</h2>
            </div>
          </div>
          <div className={styles.counts}>
            {Object.entries(COUNT_LABELS).map(([key, label]) => (
              <div key={key}>
                <strong>{counts[key as keyof typeof counts]}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.sectionHead}>
            <div>
              <span>防止意外丢失</span>
              <h2>本地备份</h2>
            </div>
            <small>
              {settings.lastBackupAt
                ? `上次备份 ${new Date(settings.lastBackupAt).toLocaleDateString(
                    "zh-CN",
                  )}`
                : "尚未备份"}
            </small>
          </div>
          <p className={styles.muted}>
            备份文件包含全部记录、外观和页面颜色，可以在浏览器数据被清除后恢复。
          </p>
          <div className={styles.actions}>
            <Button onClick={() => void exportBackup()}>
              <Download size={15} aria-hidden="true" />
              导出备份
            </Button>
            <Button onClick={() => fileInput.current?.click()}>
              <Upload size={15} aria-hidden="true" />
              导入备份
            </Button>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              aria-label="选择备份文件"
              onChange={(event) => void chooseBackup(event)}
            />
          </div>
          <p className={styles.warningNote}>
            <TriangleAlert size={13} aria-hidden="true" />
            清除浏览器网站数据可能会删除本机记录。
          </p>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
        </article>
      </div>

      <article className={styles.settingsCard}>
        <div className={styles.sectionHead}>
          <div>
            <span>外观</span>
            <h2>显示方式</h2>
          </div>
          <div className={styles.themeSwitch} role="group" aria-label="外观">
            {(Object.keys(THEME_LABELS) as ThemeMode[]).map((theme) => (
              <button
                key={theme}
                type="button"
                className={settings.theme === theme ? styles.selected : ""}
                onClick={() => void changeTheme(theme)}
              >
                {THEME_LABELS[theme]}
              </button>
            ))}
          </div>
        </div>
      </article>

      <article className={styles.settingsCard}>
        <div className={styles.sectionHead}>
          <div>
            <span>页面颜色</span>
            <h2>每个模块使用不同颜色</h2>
            <p className={styles.muted}>
              修改后，导航标记、页面强调线和按钮会同步变化。
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void resetColors()}>
            <RotateCcw size={14} aria-hidden="true" />
            恢复默认
          </Button>
        </div>
        <div className={styles.colorGrid}>
          {PAGE_KEYS.map((page) => (
            <label key={page} className={styles.colorControl}>
              <i
                aria-hidden="true"
                style={{ backgroundColor: settings.pageColors[page] }}
              />
              <span>{PAGE_LABELS[page]}</span>
              <input
                type="color"
                value={settings.pageColors[page]}
                aria-label={`${PAGE_LABELS[page]}颜色`}
                onChange={(event) => void changeColor(page, event.target.value)}
              />
            </label>
          ))}
        </div>
        <div className={styles.preview}>
          <span>当前页面预览</span>
          <Button size="sm" variant="primary">
            强调按钮
          </Button>
          <i aria-hidden="true" />
        </div>
      </article>

      <article className={`${styles.settingsCard} ${styles.dangerRow}`}>
        <div>
          <span>不可撤销操作</span>
          <h2>清空全部数据</h2>
          <p className={styles.muted}>删除所有个人记录，保留外观和页面颜色设置。</p>
        </div>
        <Button variant="danger" onClick={() => setClearOpen(true)}>
          <Database size={15} aria-hidden="true" />
          清空数据
        </Button>
      </article>

      <ConfirmDialog
        open={backupPreview !== null}
        title="恢复这个备份吗？"
        description={
          previewCounts
            ? `备份导出时间：${new Date(previewCounts.exportedAt).toLocaleString(
                "zh-CN",
              )}。将覆盖当前全部记录；待办 ${
                previewCounts.counts.todos
              } 条、健身 ${previewCounts.counts.fitnessEntries} 条、饮食 ${
                previewCounts.counts.dietEntries
              } 条、娱乐 ${previewCounts.counts.entertainmentItems} 项、学习 ${
                previewCounts.counts.studyEntries
              } 条、心情 ${previewCounts.counts.moodEntries} 条。`
            : ""
        }
        confirmLabel={importing ? "恢复中…" : "确认恢复"}
        confirmDisabled={importing}
        onCancel={() => setBackupPreview(null)}
        onConfirm={() => void restoreBackup()}
      />
      <ClearDataDialog open={clearOpen} onClose={() => setClearOpen(false)} />
    </>
  );
}
