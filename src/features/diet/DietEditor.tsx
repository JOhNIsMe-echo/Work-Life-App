import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type { DietEntry, MealType } from "../../domain/types";

const MEALS: Array<{ value: MealType; label: string }> = [
  { value: "breakfast", label: "早餐" },
  { value: "lunch", label: "午餐" },
  { value: "dinner", label: "晚餐" },
  { value: "snack", label: "加餐" },
];

type DietEditorProps = {
  open: boolean;
  entry: DietEntry | null;
  defaultMeal: MealType;
  defaultDate: DietEntry["date"];
  onClose: () => void;
  onDelete: (entry: DietEntry) => Promise<void>;
};

export function DietEditor({
  open,
  entry,
  defaultMeal,
  defaultDate,
  onClose,
  onDelete,
}: DietEditorProps) {
  const { notify } = useToast();
  const [meal, setMeal] = useState<MealType>(entry?.meal ?? defaultMeal);
  const [food, setFood] = useState(entry?.food ?? "");
  const [portion, setPortion] = useState(entry?.portion ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [time, setTime] = useState("12:00");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!food.trim()) {
      setError("请输入吃了什么。");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: date as DietEntry["date"],
        meal,
        food: food.trim(),
        portion: portion.trim() || undefined,
        recordedAt: new Date(`${date}T${time || "12:00"}:00`).toISOString(),
        notes: notes.trim() || undefined,
      };
      if (entry) {
        await repositories.diet.update(entry.id, payload);
        notify("饮食记录已更新");
      } else {
        await repositories.diet.create(payload);
        notify("饮食记录已保存");
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
      title={entry ? "编辑饮食记录" : "添加饮食记录"}
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
          <Button type="submit" form="diet-form" variant="primary" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="diet-form" className="form" onSubmit={save}>
        <div className="fieldGrid">
          <label className="field">
            <span>所属餐次</span>
            <select
              value={meal}
              onChange={(event) => setMeal(event.target.value as MealType)}
            >
              {MEALS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>日期</span>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(event) => setDate(event.target.value as DietEntry["date"])}
            />
          </label>
        </div>
        <label className="field">
          <span>吃了什么</span>
          <input
            value={food}
            placeholder="例如：鸡胸肉沙拉"
            onChange={(event) => setFood(event.target.value)}
          />
        </label>
        <div className="fieldGrid">
          <label className="field">
            <span>大致份量</span>
            <input
              value={portion}
              placeholder="1 份 / 1 杯"
              onChange={(event) => setPortion(event.target.value)}
            />
          </label>
          <label className="field">
            <span>记录时间</span>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>备注</span>
          <textarea
            rows={3}
            value={notes}
            placeholder="例如：酱少一点"
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
