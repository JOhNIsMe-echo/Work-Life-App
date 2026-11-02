import { useLiveQuery } from "dexie-react-hooks";
import { Clock3, Gamepad2, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import type {
  EntertainmentCategory,
  EntertainmentItem,
  EntertainmentStatus,
} from "../../domain/types";
import { EntertainmentEditor } from "./EntertainmentEditor";
import { EntertainmentProgress } from "./EntertainmentProgress";
import styles from "./EntertainmentPage.module.css";

type Filter = "all" | EntertainmentStatus;

const STATUS_LABELS: Record<EntertainmentStatus, string> = {
  wanted: "想玩 / 想看",
  playing: "正在进行",
  completed: "已完成",
  paused: "暂时搁置",
};

const CATEGORY_LABELS: Record<EntertainmentCategory, string> = {
  game: "游戏",
  movie: "电影",
  series: "剧集",
  other: "其他",
};

const COVER_LABELS: Record<EntertainmentCategory, string> = {
  game: "游戏",
  movie: "电影",
  series: "剧集",
  other: "其他",
};

export function EntertainmentDashboard() {
  const { notify, notifyUndo } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EntertainmentItem | null>(null);
  const [progressItem, setProgressItem] = useState<EntertainmentItem | null>(null);
  const items = useLiveQuery(() => repositories.entertainment.ordered(), [], []);
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );
  const counts = useMemo(
    () => ({
      playing: items.filter((item) => item.status === "playing").length,
      wanted: items.filter((item) => item.status === "wanted").length,
      completed: items.filter((item) => item.status === "completed").length,
    }),
    [items],
  );

  function openEditor(item?: EntertainmentItem) {
    setEditingItem(item ?? null);
    setEditorOpen(true);
  }

  async function updateStatus(item: EntertainmentItem, status: string) {
    try {
      await repositories.entertainment.update(item.id, {
        status: status as EntertainmentStatus,
      });
      notify("项目状态已更新");
    } catch {
      notify("状态更新失败，请重试");
    }
  }

  async function remove(item: EntertainmentItem) {
    try {
      const removed = await repositories.entertainment.remove(item.id);
      setEditorOpen(false);
      if (removed) {
        notifyUndo("娱乐项目已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.entertainment.restore(removed);
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
        eyebrow="想玩的、正在玩的，都记下来"
        title="游戏娱乐"
        description="这里只保存项目、状态、时长和感受，不连接游戏或影视平台。"
        action={
          <Button variant="primary" onClick={() => openEditor()}>
            <Plus size={16} aria-hidden="true" />
            添加项目
          </Button>
        }
      />

      <div className={styles.filters} role="group" aria-label="筛选娱乐项目">
        {[
          { key: "all" as const, label: "全部", count: items.length },
          { key: "playing" as const, label: "正在进行", count: counts.playing },
          { key: "wanted" as const, label: "想玩 / 想看", count: counts.wanted },
          { key: "completed" as const, label: "已完成", count: counts.completed },
          {
            key: "paused" as const,
            label: "暂时搁置",
            count: items.filter((item) => item.status === "paused").length,
          },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={filter === item.key ? styles.selected : ""}
            onClick={() => setFilter(item.key)}
          >
            {item.label} <span>{item.count}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="还没有记录娱乐项目"
          description="把想玩的游戏、想看的电影先放在这里。"
          action={
            <Button variant="primary" onClick={() => openEditor()}>
              <Plus size={15} aria-hidden="true" />
              添加第一个项目
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="这个状态下没有项目"
          description="切换其他状态，或添加一个新项目。"
        />
      ) : (
        <div className={styles.itemGrid}>
          {filtered.map((item) => (
            <article key={item.id} className={styles.itemCard}>
              <div className={styles.cover} aria-hidden="true">
                <Gamepad2 size={25} />
                <span>{COVER_LABELS[item.category]}</span>
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemTop}>
                  <span>
                    {CATEGORY_LABELS[item.category]} ·{" "}
                    {format(parseISO(item.date), "M月d日")}
                  </span>
                  <select
                    aria-label={`更新状态：${item.title}`}
                    value={item.status}
                    onChange={(event) => void updateStatus(item, event.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <h2>{item.title}</h2>
                <p>{item.notes || "还没有记录感受"}</p>
                <div className={styles.itemMeta}>
                  <span>
                    <Clock3 size={12} aria-hidden="true" />
                    {Math.round((item.totalMinutes / 60) * 10) / 10} 小时
                  </span>
                  <span>
                    <Star size={12} aria-hidden="true" />
                    {item.rating ? `${item.rating} 分` : "未评分"}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProgressItem(item)}
                  >
                    补记时长
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`编辑娱乐项目：${item.title}`}
                    onClick={() => openEditor(item)}
                  >
                    编辑
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen ? (
        <EntertainmentEditor
          key={editingItem?.id ?? "new-entertainment"}
          open
          item={editingItem}
          onClose={() => setEditorOpen(false)}
          onDelete={remove}
        />
      ) : null}
      {progressItem ? (
        <EntertainmentProgress
          key={progressItem.id}
          item={progressItem}
          onClose={() => setProgressItem(null)}
        />
      ) : null}
    </>
  );
}
