import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { isDateInRange, todayKey, weekRange } from "../../domain/dates";
import type { StudyEntry } from "../../domain/types";
import { StudyEditor } from "./StudyEditor";
import styles from "./StudyPage.module.css";

const PROGRESS_LABELS = {
  started: "刚开始",
  in_progress: "进行中",
  completed: "已完成",
} as const;

export function StudyDashboard() {
  const { notify, notifyUndo } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StudyEntry | null>(null);
  const entries = useLiveQuery(() => repositories.study.list(), [], []);
  const today = todayKey();
  const week = weekRange();
  const todayEntries = entries.filter((entry) => entry.date === today);
  const weekEntries = entries.filter((entry) =>
    isDateInRange(entry.date, week.start, week.end),
  );
  const todayMinutes = todayEntries.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const weekMinutes = weekEntries.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const subjectTotals = (() => {
    const totals = new Map<string, number>();
    weekEntries.forEach((entry) => {
      totals.set(
        entry.subject,
        (totals.get(entry.subject) ?? 0) + entry.durationMinutes,
      );
    });
    return [...totals.entries()]
      .toSorted((left, right) => right[1] - left[1])
      .slice(0, 4);
  })();
  const maxSubjectMinutes = Math.max(1, ...subjectTotals.map(([, value]) => value));
  const recent = entries
    .toSorted((left, right) => right.studiedAt.localeCompare(left.studiedAt))
    .slice(0, 12);

  function openEditor(entry?: StudyEntry) {
    setEditingEntry(entry ?? null);
    setEditorOpen(true);
  }

  async function remove(entry: StudyEntry) {
    try {
      const removed = await repositories.study.remove(entry.id);
      setEditorOpen(false);
      if (removed) {
        notifyUndo("学习记录已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.study.restore(removed);
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
        eyebrow={`今天已经学习 ${todayEntries.length} 次`}
        title="学业记录"
        description="记住学了什么、学了多久，以及这次学到哪里。"
        action={
          <Button variant="primary" onClick={() => openEditor()}>
            <Plus size={16} aria-hidden="true" />
            记录学习
          </Button>
        }
      />

      <div className={styles.overview}>
        <article className={styles.totalCard}>
          <span>今日学习</span>
          <strong>
            {todayMinutes} <small>分钟</small>
          </strong>
          <p>本周累计 {formatMinutes(weekMinutes)}</p>
        </article>
        <article className={styles.subjectCard}>
          <div className={styles.sectionHead}>
            <div>
              <span>本周投入</span>
              <h2>学习方向</h2>
            </div>
          </div>
          {subjectTotals.length === 0 ? (
            <p className={styles.emptySubjects}>本周还没有学习记录</p>
          ) : (
            subjectTotals.map(([subject, minutes]) => (
              <div key={subject} className={styles.subjectRow}>
                <div>
                  <span>{subject}</span>
                  <strong>{formatMinutes(minutes)}</strong>
                </div>
                <div className={styles.progressTrack}>
                  <span style={{ width: `${(minutes / maxSubjectMinutes) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </article>
      </div>

      <div className={styles.sectionTitle}>
        <div>
          <span>最近记录</span>
          <h2>学习过程</h2>
        </div>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="还没有学习记录"
          description="完成一次阅读、练习或课程后，记下学习内容和时长。"
          action={
            <Button variant="primary" onClick={() => openEditor()}>
              <Plus size={15} aria-hidden="true" />
              记录第一次学习
            </Button>
          }
        />
      ) : (
        <div className={styles.sessions}>
          {recent.map((entry) => (
            <article key={entry.id}>
              <time>
                {format(parseISO(entry.studiedAt), "M月d日")}
                <small>{entry.durationMinutes} 分钟</small>
              </time>
              <div>
                <div className={styles.sessionTop}>
                  <span className={styles.progressPill}>
                    {PROGRESS_LABELS[entry.progress]}
                  </span>
                  <strong>{entry.subject}</strong>
                </div>
                <h2>{entry.content}</h2>
                {entry.goalOrNotes ? <p>{entry.goalOrNotes}</p> : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`编辑学习记录：${entry.content}`}
                onClick={() => openEditor(entry)}
              >
                编辑
              </Button>
            </article>
          ))}
        </div>
      )}

      {editorOpen ? (
        <StudyEditor
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

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} 小时${rest > 0 ? ` ${rest} 分` : ""}`;
}
