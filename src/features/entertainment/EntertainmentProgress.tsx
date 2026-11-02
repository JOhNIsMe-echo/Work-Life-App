import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import type { EntertainmentItem, EntertainmentStatus } from "../../domain/types";

const STATUS_LABELS: Record<EntertainmentStatus, string> = {
  wanted: "想玩 / 想看",
  playing: "正在进行",
  completed: "已完成",
  paused: "暂时搁置",
};

type EntertainmentProgressProps = {
  item: EntertainmentItem;
  onClose: () => void;
};

export function EntertainmentProgress({ item, onClose }: EntertainmentProgressProps) {
  const { notify } = useToast();
  const [minutes, setMinutes] = useState("");
  const [status, setStatus] = useState<EntertainmentStatus>(item.status);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const addedMinutes = minutes === "" ? 0 : Number(minutes);
    if (!Number.isInteger(addedMinutes) || addedMinutes < 0) {
      setError("本次时长必须是大于或等于 0 的整数。");
      return;
    }

    setSaving(true);
    try {
      await repositories.entertainment.update(item.id, {
        totalMinutes: item.totalMinutes + addedMinutes,
        status,
      });
      notify("娱乐进度已更新");
      onClose();
    } catch {
      setError("保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditDrawer
      open
      title="更新娱乐进度"
      eyebrow={item.title}
      onClose={onClose}
      footer={
        <div className="footer">
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button
            type="submit"
            form="entertainment-progress-form"
            variant="primary"
            disabled={saving}
          >
            {saving ? "保存中…" : "保存进度"}
          </Button>
        </div>
      }
    >
      <form id="entertainment-progress-form" className="form" onSubmit={save}>
        <label className="field">
          <span>本次投入时长（分钟）</span>
          <input
            type="number"
            min="0"
            step="1"
            value={minutes}
            placeholder="例如：45"
            onChange={(event) => setMinutes(event.target.value)}
          />
        </label>
        <p className="muted">原累计 {item.totalMinutes} 分钟，保存后自动累加。</p>
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
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </EditDrawer>
  );
}
