import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheckBig,
  Clock3,
  Dumbbell,
  Gamepad2,
  Pin,
  Plus,
  Smile,
  Utensils,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../../app/settings-context";
import { Button } from "../../components/Button/Button";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { summarizeHome } from "../../domain/aggregations";
import { formatChineseDate } from "../../domain/dates";
import type { Memo, MoodValue, PageKey, Todo } from "../../domain/types";
import { MemoEditor } from "./MemoEditor";
import styles from "./HomePage.module.css";

const QUICK_LINKS = [
  { to: "/todos", label: "待办", icon: CircleCheckBig },
  { to: "/fitness", label: "运动", icon: Dumbbell },
  { to: "/diet", label: "饮食", icon: Utensils },
  { to: "/entertainment", label: "娱乐", icon: Gamepad2 },
  { to: "/study", label: "学习", icon: Clock3 },
  { to: "/mood", label: "心情", icon: Smile },
];

const MOOD_LABELS: Record<MoodValue, string> = {
  happy: "开心",
  calm: "平静",
  tired: "疲惫",
  anxious: "焦虑",
  low: "低落",
};

export function HomeDashboard() {
  const { notify, notifyUndo } = useToast();
  const { settings } = useSettings();
  const [memoOpen, setMemoOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const data = useLiveQuery(async () => {
    const [
      todos,
      memos,
      fitnessEntries,
      dietEntries,
      entertainmentItems,
      studyEntries,
      moodEntries,
    ] = await Promise.all([
      repositories.todos.list(),
      repositories.memos.ordered(),
      repositories.fitness.list(),
      repositories.diet.list(),
      repositories.entertainment.list(),
      repositories.study.list(),
      repositories.mood.list(),
    ]);
    return {
      todos,
      memos,
      fitnessEntries,
      dietEntries,
      entertainmentItems,
      studyEntries,
      moodEntries,
    };
  }, []);

  const summary = useMemo(
    () =>
      summarizeHome({
        todos: data?.todos ?? [],
        fitnessEntries: data?.fitnessEntries ?? [],
        dietEntries: data?.dietEntries ?? [],
        entertainmentItems: data?.entertainmentItems ?? [],
        studyEntries: data?.studyEntries ?? [],
        moodEntries: data?.moodEntries ?? [],
      }),
    [data],
  );

  async function toggleTodo(todo: Todo) {
    try {
      await repositories.todos.setCompleted(todo.id, !todo.completed);
      notify(todo.completed ? "待办已恢复" : "待办已完成");
    } catch {
      notify("待办更新失败，请重试");
    }
  }

  function openMemo(memo?: Memo) {
    setEditingMemo(memo ?? null);
    setMemoOpen(true);
  }

  async function toggleMemoPin(memo: Memo) {
    try {
      await repositories.memos.update(memo.id, { pinned: !memo.pinned });
      notify(memo.pinned ? "已取消置顶" : "备忘已置顶");
    } catch {
      notify("备忘更新失败，请重试");
    }
  }

  async function deleteMemo(memo: Memo) {
    try {
      const removed = await repositories.memos.remove(memo.id);
      setMemoOpen(false);
      if (removed) {
        notifyUndo("备忘已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.memos.restore(removed);
          },
        });
      }
    } catch {
      notify("删除失败，请重试");
    }
  }

  const visibleMemos = (data?.memos ?? []).slice(0, 2);
  const cardStyle = (key: PageKey) =>
    ({
      "--card-accent": settings.pageColors[key],
    }) as CSSProperties;

  return (
    <>
      <PageHeader
        eyebrow={formatChineseDate()}
        title="今天，按自己的节奏来"
        description="待办、备忘和生活记录都在这里汇总。你只需要记下真正重要的事情。"
        action={
          <details className={styles.quickRecord}>
            <summary>
              <Plus size={16} aria-hidden="true" />
              快速记录
            </summary>
            <div className={styles.quickMenu}>
              {QUICK_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}>
                    <Icon size={15} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </details>
        }
      />

      <div className={styles.metricStrip}>
        <article>
          <span className={styles.metricIcon}>
            <CircleCheckBig size={17} aria-hidden="true" />
          </span>
          <div>
            <span>今日待办</span>
            <strong>
              {summary.todos.completed} / {summary.todos.total}
            </strong>
          </div>
          <div className={styles.progress} aria-hidden="true">
            <span
              style={{
                width: `${
                  summary.todos.total === 0
                    ? 0
                    : (summary.todos.completed / summary.todos.total) * 100
                }%`,
              }}
            />
          </div>
        </article>
        <article>
          <span className={styles.metricIcon}>
            <Dumbbell size={17} aria-hidden="true" />
          </span>
          <div>
            <span>活动时间</span>
            <strong>{summary.fitness.totalMinutes} 分钟</strong>
          </div>
          <small>{summary.fitness.count} 项运动</small>
        </article>
        <article>
          <span className={styles.metricIcon}>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>学习时间</span>
            <strong>{summary.study.totalMinutes} 分钟</strong>
          </div>
          <small>{summary.study.count} 次学习</small>
        </article>
      </div>

      <div className={styles.focusGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>先处理重要的事</span>
              <h2>今日待办</h2>
            </div>
            <Link to="/todos">查看全部</Link>
          </div>
          <div className={styles.homeTasks}>
            {summary.todos.topIncomplete.length === 0 ? (
              <div className={styles.inlineEmpty}>
                <CalendarDays size={18} aria-hidden="true" />
                <span>今天还没有未完成待办</span>
                <Link to="/todos">添加一项</Link>
              </div>
            ) : (
              summary.todos.topIncomplete.map((todo) => (
                <label key={todo.id} className={styles.miniTask}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => void toggleTodo(todo)}
                  />
                  <span className={styles.checkbox} aria-hidden="true">
                    {todo.completed ? <Check size={12} /> : null}
                  </span>
                  <span className={styles.taskCopy}>
                    <strong>{todo.title}</strong>
                    <small>
                      {todo.isImportant ? "重要" : "今日"}
                      {todo.notes ? ` · ${todo.notes}` : ""}
                    </small>
                  </span>
                </label>
              ))
            )}
          </div>
          <Link to="/todos" className={styles.inlineAdd}>
            <Plus size={14} aria-hidden="true" />
            添加今天要做的事
          </Link>
        </section>

        <section className={`${styles.panel} ${styles.memoPanel}`}>
          <div className={styles.panelHead}>
            <div>
              <span>随手记住</span>
              <h2>快速备忘</h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="新增备忘"
              onClick={() => openMemo()}
            >
              <Plus size={15} aria-hidden="true" />
            </Button>
          </div>
          <div className={styles.memoList}>
            {visibleMemos.length === 0 ? (
              <button
                type="button"
                className={styles.emptyMemo}
                onClick={() => openMemo()}
              >
                <Plus size={16} aria-hidden="true" />
                写一条随手备忘
              </button>
            ) : (
              visibleMemos.map((memo) => (
                <article
                  key={memo.id}
                  className={`${styles.memo} ${memo.pinned ? styles.pinnedMemo : ""}`}
                >
                  <button
                    type="button"
                    className={styles.memoBody}
                    onClick={() => openMemo(memo)}
                  >
                    <span>{memo.content}</span>
                    <small>
                      {memo.pinned ? "置顶 · " : ""}
                      {new Date(memo.updatedAt).toLocaleDateString("zh-CN")}
                    </small>
                  </button>
                  <button
                    type="button"
                    className={`${styles.pinButton} ${memo.pinned ? styles.pinned : ""}`}
                    aria-label={memo.pinned ? "取消置顶备忘" : "置顶备忘"}
                    onClick={() => void toggleMemoPin(memo)}
                  >
                    <Pin size={14} aria-hidden="true" />
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <div className={styles.sectionTitle}>
        <div>
          <span>今天的生活片段</span>
          <h2>各模块摘要</h2>
        </div>
        <small>所有记录只保存在这台电脑</small>
      </div>

      <div className={styles.lifeGrid}>
        <Link to="/fitness" className={styles.lifeCard} style={cardStyle("fitness")}>
          <span className={styles.lifeIcon}>
            <Dumbbell size={16} aria-hidden="true" />
          </span>
          <small>健身</small>
          <strong>
            {summary.fitness.totalMinutes > 0
              ? `${summary.fitness.totalMinutes} 分钟`
              : "今天还没有记录"}
          </strong>
          <p>
            {summary.fitness.latest
              ? `${summary.fitness.count} 项运动 · 最近 ${summary.fitness.latest.activity}`
              : "记录一次认真完成的活动"}
          </p>
          <span className={styles.cardLink}>
            查看记录 <ArrowRight size={13} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/diet" className={styles.lifeCard} style={cardStyle("diet")}>
          <span className={styles.lifeIcon}>
            <Utensils size={16} aria-hidden="true" />
          </span>
          <small>饮食</small>
          <strong>
            {summary.diet.recordedMeals.length > 0
              ? `已记录 ${summary.diet.recordedMeals.length} / 4 餐`
              : "今天还没有记录"}
          </strong>
          <p>
            {summary.diet.latest
              ? `最近：${summary.diet.latest.food}`
              : "按四餐记录吃过什么"}
          </p>
          <span className={styles.cardLink}>
            查看记录 <ArrowRight size={13} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/entertainment" className={styles.lifeCard} style={cardStyle("fun")}>
          <span className={styles.lifeIcon}>
            <Gamepad2 size={16} aria-hidden="true" />
          </span>
          <small>游戏娱乐</small>
          <strong>
            {summary.entertainment.latestActive?.title ?? "暂时没有进行中的项目"}
          </strong>
          <p>
            {summary.entertainment.activeCount > 0
              ? `${summary.entertainment.activeCount} 项正在进行`
              : "记录想玩和正在玩的"}
          </p>
          <span className={styles.cardLink}>
            查看项目 <ArrowRight size={13} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/study" className={styles.lifeCard} style={cardStyle("study")}>
          <span className={styles.lifeIcon}>
            <Clock3 size={16} aria-hidden="true" />
          </span>
          <small>学业</small>
          <strong>
            {summary.study.totalMinutes > 0
              ? `学习 ${summary.study.totalMinutes} 分钟`
              : "今天还没有记录"}
          </strong>
          <p>
            {summary.study.count > 0
              ? `共 ${summary.study.count} 次学习`
              : "记下学了什么和学到哪里"}
          </p>
          <span className={styles.cardLink}>
            查看记录 <ArrowRight size={13} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/mood" className={styles.lifeCard} style={cardStyle("mood")}>
          <span className={styles.lifeIcon}>
            <Smile size={16} aria-hidden="true" />
          </span>
          <small>心情</small>
          <strong>
            {summary.mood.latest
              ? MOOD_LABELS[summary.mood.latest.mood]
              : "今天还没有记录"}
          </strong>
          <p>
            {summary.mood.latest
              ? `最近一次 · ${new Date(
                  summary.mood.latest.recordedAt,
                ).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "停下来看看此刻的感受"}
          </p>
          <span className={styles.cardLink}>
            查看心情 <ArrowRight size={13} aria-hidden="true" />
          </span>
        </Link>
      </div>

      {memoOpen ? (
        <MemoEditor
          key={editingMemo?.id ?? "new-memo"}
          open
          memo={editingMemo}
          onClose={() => setMemoOpen(false)}
          onDelete={deleteMemo}
        />
      ) : null}
    </>
  );
}
