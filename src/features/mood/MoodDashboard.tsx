import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Smile } from "lucide-react";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { recentDateKeys, todayKey } from "../../domain/dates";
import type { MoodEntry, MoodValue } from "../../domain/types";
import { MoodEditor } from "./MoodEditor";
import styles from "./MoodPage.module.css";

const MOOD_INFO: Record<MoodValue, { emoji: string; label: string }> = {
  happy: { emoji: "😄", label: "开心" },
  calm: { emoji: "😌", label: "平静" },
  tired: { emoji: "😴", label: "疲惫" },
  anxious: { emoji: "😕", label: "焦虑" },
  low: { emoji: "😔", label: "低落" },
};

export function MoodDashboard() {
  const { notify, notifyUndo } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const entries = useLiveQuery(() => repositories.mood.list(), [], []);
  const today = todayKey();
  const todayEntries = entries
    .filter((entry) => entry.date === today)
    .toSorted((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const latest = todayEntries[0];
  const week = useMemo(() => {
    const dates = recentDateKeys(7);
    return dates.map((date) => ({
      date,
      latest: entries
        .filter((entry) => entry.date === date)
        .toSorted((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0],
    }));
  }, [entries]);

  function openEditor(entry?: MoodEntry) {
    setEditingEntry(entry ?? null);
    setEditorOpen(true);
  }

  async function remove(entry: MoodEntry) {
    try {
      const removed = await repositories.mood.remove(entry.id);
      setEditorOpen(false);
      if (removed) {
        notifyUndo("心情记录已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.mood.restore(removed);
          },
        });
      }
    } catch {
      notify("删除失败，请重试");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          latest
            ? `今天的最后一次记录 · ${format(parseISO(latest.recordedAt), "HH:mm")}`
            : "一天可以记录很多次"
        }
        title="心情记录"
        description="记录当下心情和影响心情的事情，不急着给自己下结论。"
        action={
          <Button variant="primary" onClick={() => openEditor()}>
            <Plus size={16} aria-hidden="true" />
            记录此刻
          </Button>
        }
      />

      {latest ? (
        <article className={styles.focus}>
          <span className={styles.focusEmoji} aria-hidden="true">
            {MOOD_INFO[latest.mood].emoji}
          </span>
          <div>
            <span>最近一次心情</span>
            <h2>{MOOD_INFO[latest.mood].label}</h2>
            <p>{latest.note || "这一刻没有留下文字，也可以。"}</p>
            {latest.tags.length > 0 ? (
              <div className={styles.tags}>
                {latest.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ) : (
        <EmptyState
          icon={Smile}
          title="今天还没有心情记录"
          description="不需要等到有很强烈的感受，普通的一刻也值得留下。"
          action={
            <Button variant="primary" onClick={() => openEditor()}>
              <Plus size={15} aria-hidden="true" />
              记录现在
            </Button>
          }
        />
      )}

      <div className={styles.sectionTitle}>
        <div>
          <span>最近 7 天</span>
          <h2>每天的心情片段</h2>
        </div>
      </div>
      <div className={styles.weekRow}>
        {week.map((day) => (
          <div key={day.date} className={day.date === today ? styles.today : ""}>
            <span>{format(parseISO(day.date), "E")}</span>
            <strong aria-hidden="true">
              {day.latest ? MOOD_INFO[day.latest.mood].emoji : "·"}
            </strong>
            <small>{day.latest ? MOOD_INFO[day.latest.mood].label : "未记录"}</small>
          </div>
        ))}
      </div>

      {todayEntries.length > 0 ? (
        <>
          <div className={styles.sectionTitle}>
            <div>
              <span>今天</span>
              <h2>全部心情记录</h2>
            </div>
            <small>{todayEntries.length} 条</small>
          </div>
          <div className={styles.timeline}>
            {todayEntries.map((entry) => (
              <button key={entry.id} type="button" onClick={() => openEditor(entry)}>
                <time>{format(parseISO(entry.recordedAt), "HH:mm")}</time>
                <span aria-hidden="true">{MOOD_INFO[entry.mood].emoji}</span>
                <span>
                  <strong>{MOOD_INFO[entry.mood].label}</strong>
                  <small>{entry.note || "没有补充文字"}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {editorOpen ? (
        <MoodEditor
          key={editingEntry?.id ?? `new-${today}`}
          open
          entry={editingEntry}
          onClose={() => setEditorOpen(false)}
          onDelete={remove}
        />
      ) : null}
    </>
  );
}
