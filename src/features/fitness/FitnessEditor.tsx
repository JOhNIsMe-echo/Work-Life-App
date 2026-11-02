import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type { FitnessEntry } from "../../domain/types";

type FitnessEditorProps = {
  open: boolean;
  entry: FitnessEntry | null;
  defaultDate?: FitnessEntry["date"];
  onClose: () => void;
  onDelete: (entry: FitnessEntry) => Promise<void>;
};

function timeFromIso(value: string): string {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function FitnessEditor({
  open,
  entry,
  defaultDate = todayKey(),
  onClose,
  onDelete,
}: FitnessEditorProps) {
  const { notify } = useToast();
  const [activity, setActivity] = useState(entry?.activity ?? "");
  const [duration, setDuration] = useState(entry ? String(entry.durationMinutes) : "");
  const [calories, setCalories] = useState(
    entry?.calories ? String(entry.calories) : "",
  );
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [time, setTime] = useState(entry ? timeFromIso(entry.performedAt) : "18:00");
  const [feeling, setFeeling] = useState(entry?.feeling ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDuration = Number(duration);
    if (!activity.trim()) {
      setError("请输入运动项目。");
      return;
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      setError("运动时长必须是大于 0 的整数。");
      return;
    }

    const parsedCalories = calories.trim() === "" ? undefined : Number(calories);
    if (
      parsedCalories !== undefined &&
      (!Number.isFinite(parsedCalories) || parsedCalories < 0)
    ) {
      setError("消耗热量不能小于 0。");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        activity: activity.trim(),
        durationMinutes: parsedDuration,
        calories: parsedCalories,
        date: date as FitnessEntry["date"],
        performedAt: new Date(`${date}T${time}:00`).toISOString(),
        feeling: feeling.trim() || undefined,
      };
      if (entry) {
        await repositories.fitness.update(entry.id, payload);
        notify("运动记录已更新");
      } else {
        await repositories.fitness.create(payload);
        notify("运动记录已保存");
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
      title={entry ? "编辑运动记录" : "记录一次运动"}
      onClose={onClose}
      footer={
        <div className="footer">
          {entry ? (
            <Button
              variant="danger"
              onClick={() => void onDelete(entry)}
              disabled={saving}
            >
              删除
            </Button>
          ) : null}
          <span style={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form="fitness-form" variant="primary" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="fitness-form" className="form" onSubmit={save}>
        <label className="field">
          <span>运动项目</span>
          <input
            value={activity}
            placeholder="跑步、力量训练、散步……"
            onChange={(event) => setActivity(event.target.value)}
          />
        </label>
        <div className="fieldGrid">
          <label className="field">
            <span>运动时长（分钟）</span>
            <input
              type="number"
              min="1"
              step="1"
              value={duration}
              placeholder="30"
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>
          <label className="field">
            <span>大致消耗（千卡，可不填）</span>
            <input
              type="number"
              min="0"
              value={calories}
              placeholder="可选"
              onChange={(event) => setCalories(event.target.value)}
            />
          </label>
        </div>
        <div className="fieldGrid">
          <label className="field">
            <span>日期</span>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(event) => setDate(event.target.value as FitnessEntry["date"])}
            />
          </label>
          <label className="field">
            <span>完成时间</span>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>身体感受或备注</span>
          <textarea
            rows={4}
            value={feeling}
            placeholder="感觉怎么样？"
            onChange={(event) => setFeeling(event.target.value)}
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
