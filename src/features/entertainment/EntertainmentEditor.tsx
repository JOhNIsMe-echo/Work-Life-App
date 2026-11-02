import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type {
  EntertainmentCategory,
  EntertainmentItem,
  EntertainmentStatus,
} from "../../domain/types";

const CATEGORY_LABELS: Record<EntertainmentCategory, string> = {
  game: "游戏",
  movie: "电影",
  series: "剧集",
  other: "其他",
};

const STATUS_LABELS: Record<EntertainmentStatus, string> = {
  wanted: "想玩 / 想看",
  playing: "正在进行",
  completed: "已完成",
  paused: "暂时搁置",
};

type EntertainmentEditorProps = {
  open: boolean;
  item: EntertainmentItem | null;
  onClose: () => void;
  onDelete: (item: EntertainmentItem) => Promise<void>;
};

export function EntertainmentEditor({
  open,
  item,
  onClose,
  onDelete,
}: EntertainmentEditorProps) {
  const { notify } = useToast();
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState<EntertainmentCategory>(
    item?.category ?? "game",
  );
  const [status, setStatus] = useState<EntertainmentStatus>(item?.status ?? "wanted");
  const [date, setDate] = useState(item?.date ?? todayKey());
  const [minutes, setMinutes] = useState(item ? String(item.totalMinutes) : "0");
  const [rating, setRating] = useState(item?.rating ? String(item.rating) : "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedMinutes = Number(minutes);
    if (!title.trim()) {
      setError("请输入项目名称。");
      return;
    }
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 0) {
      setError("累计时长必须是大于或等于 0 的整数。");
      return;
    }

    const parsedRating = rating === "" ? undefined : Number(rating);
    if (
      parsedRating !== undefined &&
      (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5)
    ) {
      setError("评分必须在 1 到 5 之间。");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        status,
        date: date as EntertainmentItem["date"],
        totalMinutes: parsedMinutes,
        rating: parsedRating,
        notes: notes.trim() || undefined,
      };
      if (item) {
        await repositories.entertainment.update(item.id, payload);
        notify("娱乐项目已更新");
      } else {
        await repositories.entertainment.create(payload);
        notify("娱乐项目已添加");
      }
      onClose();
    } catch {
      setError("保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditDrawer
      open={open}
      title={item ? "编辑娱乐项目" : "添加娱乐项目"}
      onClose={onClose}
      footer={
        <div className="footer">
          {item ? (
            <Button
              variant="danger"
              onClick={() => void onDelete(item)}
              disabled={saving}
            >
              删除
            </Button>
          ) : null}
          <span style={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button
            type="submit"
            form="entertainment-form"
            variant="primary"
            disabled={saving}
          >
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="entertainment-form" className="form" onSubmit={save}>
        <label className="field">
          <span>项目名称</span>
          <input
            value={title}
            placeholder="游戏、电影或剧集名称"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <div className="fieldGrid">
          <label className="field">
            <span>类型</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as EntertainmentCategory)
              }
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>当前状态</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as EntertainmentStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="fieldGrid">
          <label className="field">
            <span>记录日期</span>
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value as EntertainmentItem["date"])
              }
            />
          </label>
          <label className="field">
            <span>累计时长（分钟）</span>
            <input
              type="number"
              min="0"
              step="1"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>个人评分</span>
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="">未评分</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <label className="field">
          <span>感受或备注</span>
          <textarea
            rows={4}
            value={notes}
            placeholder="写一点让自己以后想起来的感受"
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </EditDrawer>
  );
}
