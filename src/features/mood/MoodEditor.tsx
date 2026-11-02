import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type { MoodEntry, MoodValue } from "../../domain/types";
import styles from "./MoodPage.module.css";

const MOODS: Array<{ value: MoodValue; emoji: string; label: string }> = [
  { value: "happy", emoji: "😄", label: "开心" },
  { value: "calm", emoji: "😌", label: "平静" },
  { value: "tired", emoji: "😴", label: "疲惫" },
  { value: "anxious", emoji: "😕", label: "焦虑" },
  { value: "low", emoji: "😔", label: "低落" },
];

type MoodEditorProps = {
  open: boolean;
  entry: MoodEntry | null;
  onClose: () => void;
  onDelete: (entry: MoodEntry) => Promise<void>;
};

export function MoodEditor({ open, entry, onClose, onDelete }: MoodEditorProps) {
  const { notify } = useToast();
  const [mood, setMood] = useState<MoodValue>(entry?.mood ?? "calm");
  const [tags, setTags] = useState(entry?.tags.join("、") ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [date, setDate] = useState(entry?.date ?? todayKey());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        mood,
        tags: tags
          .split(/[，,、]/)
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8),
        note: note.trim() || undefined,
        date: date as MoodEntry["date"],
        recordedAt: new Date().toISOString(),
      };
      if (entry) {
        await repositories.mood.update(entry.id, payload);
        notify("心情记录已更新");
      } else {
        await repositories.mood.create(payload);
        notify("心情已记录");
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
      title={entry ? "编辑心情记录" : "记录此刻心情"}
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
          <Button type="submit" form="mood-form" variant="primary" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="mood-form" className="form" onSubmit={save}>
        <fieldset className={styles.moodChoices}>
          <legend>现在感觉怎么样？</legend>
          {MOODS.map((item) => (
            <label
              key={item.value}
              className={mood === item.value ? styles.chosenMood : ""}
            >
              <input
                type="radio"
                name="mood"
                value={item.value}
                checked={mood === item.value}
                onChange={() => setMood(item.value)}
              />
              <span aria-hidden="true">{item.emoji}</span>
              <small>{item.label}</small>
            </label>
          ))}
        </fieldset>
        <div className="fieldGrid">
          <label className="field">
            <span>日期</span>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(event) => setDate(event.target.value as MoodEntry["date"])}
            />
          </label>
          <label className="field">
            <span>心情标签</span>
            <input
              value={tags}
              placeholder="例如：期待、有点累"
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>想记下点什么</span>
          <textarea
            rows={5}
            value={note}
            placeholder="发生了什么？也可以什么都不写。"
            onChange={(event) => setNote(event.target.value)}
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
