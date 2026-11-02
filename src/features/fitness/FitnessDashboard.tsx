import { useLiveQuery } from "dexie-react-hooks";
import { Clock3, Dumbbell, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { isDateInRange, recentDateKeys, todayKey, weekRange } from "../../domain/dates";
import type { FitnessEntry } from "../../domain/types";
import { FitnessEditor } from "./FitnessEditor";
import styles from "./FitnessPage.module.css";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export function FitnessDashboard() {
  const { notify, notifyUndo } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FitnessEntry | null>(null);
  const entries = useLiveQuery(() => repositories.fitness.list(), [], []);
  const today = todayKey();
  const week = weekRange();

  const todayEntries = entries
    .filter((entry) => entry.date === today)
    .toSorted((left, right) => right.performedAt.localeCompare(left.performedAt));
  const weekEntries = entries.filter((entry) =>
    isDateInRange(entry.date, week.start, week.end),
  );
  const weekDays = new Set(weekEntries.map((entry) => entry.date)).size;
  const todayMinutes = todayEntries.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const weekMinutes = weekEntries.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const chart = useMemo(() => {
    const days = recentDateKeys(7);
    const values = days.map((date) =>
      entries
        .filter((entry) => entry.date === date)
        .reduce((total, entry) => total + entry.durationMinutes, 0),
    );
    return {
      days,
      values,
      max: Math.max(1, ...values),
    };
  }, [entries]);

  function openEditor(entry?: FitnessEntry) {
    setEditingEntry(entry ?? null);
    setEditorOpen(true);
  }

  async function remove(entry: FitnessEntry) {
    try {
      const removed = await repositories.fitness.remove(entry.id);
      setEditorOpen(false);
      if (removed) {
        notifyUndo("运动记录已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.fitness.restore(removed);
          },
        });
      }
    } catch {
      notify("删除失败，请重试");
    }
  }

  const recentEntries = entries
    .toSorted((left, right) => right.performedAt.localeCompare(left.performedAt))
    .slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="实际完成的每一次活动"
        title="健身记录"
        description="不追求漂亮的数据，只把每次认真活动的时间留下来。"
        action={
          <Button variant="primary" onClick={() => openEditor()}>
            <Plus size={16} aria-hidden="true" />
            记录运动
          </Button>
        }
      />

      <div className={styles.overview}>
        <article className={styles.totalCard}>
          <span>今天</span>
          <strong>
            {todayMinutes} <small>分钟</small>
          </strong>
          <p>{todayEntries.length} 项运动 · 状态不错</p>
          <hr />
          <div>
            <span>本周 {weekDays} 天</span>
            <strong>{weekMinutes} 分钟</strong>
          </div>
        </article>
        <article className={styles.chartCard}>
          <div className={styles.sectionHead}>
            <div>
              <span>本周活动</span>
              <h2>最近七天</h2>
            </div>
            <small>分钟</small>
          </div>
          <div
            className={styles.bars}
            role="img"
            aria-label={`最近七天运动时长：${chart.values.join("、")} 分钟`}
          >
            {chart.values.map((value, index) => (
              <div
                key={chart.days[index]}
                className={index === 6 ? styles.todayBar : undefined}
              >
                <span
                  style={{
                    height: `${Math.max(6, (value / chart.max) * 100)}%`,
                  }}
                />
                <small>{WEEKDAY_LABELS[index]}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className={styles.sectionTitle}>
        <div>
          <span>最近记录</span>
          <h2>完成过的运动</h2>
        </div>
      </div>

      {recentEntries.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="还没有运动记录"
          description="完成一次散步、跑步或力量训练后，再回来记下它。"
          action={
            <Button variant="primary" onClick={() => openEditor()}>
              <Plus size={15} aria-hidden="true" />
              记录第一次运动
            </Button>
          }
        />
      ) : (
        <div className={styles.records}>
          {recentEntries.map((entry) => (
            <article key={entry.id}>
              <span className={styles.recordIcon} aria-hidden="true">
                <Clock3 size={15} />
              </span>
              <div>
                <strong>{entry.activity}</strong>
                <p>
                  {format(parseISO(entry.performedAt), "M月d日 HH:mm")}
                  {entry.feeling ? ` · ${entry.feeling}` : ""}
                </p>
              </div>
              <span className={styles.value}>
                <strong>{entry.durationMinutes}</strong> 分钟
              </span>
              <span className={styles.value}>
                <strong>{entry.calories ?? "—"}</strong> 千卡
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`编辑运动记录：${entry.activity}`}
                onClick={() => openEditor(entry)}
              >
                编辑
              </Button>
            </article>
          ))}
        </div>
      )}

      {editorOpen ? (
        <FitnessEditor
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
