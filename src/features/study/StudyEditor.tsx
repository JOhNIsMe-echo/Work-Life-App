import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type { StudyEntry, StudyProgress } from "../../domain/types";

const PROGRESS_LABELS: Record<StudyProgress, string> = {
  started: "刚开始",
  in_progress: "进行中",
  completed: "已完成",
};

type StudyEditorProps = {
  open: boolean;
  entry: StudyEntry | null;
  onClose: () => void;
  onDelete: (entry: StudyEntry) => Promise<void>;
};

export function StudyEditor({ open, entry, onClose, onDelete }: StudyEditorProps) {
  const { notify } = useToast();
  const [subject, setSubject] = useState(entry?.subject ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [duration, setDuration] = useState(entry ? String(entry.durationMinutes) : "");
  const [progress, setProgress] = useState<StudyProgress>(
    entry?.progress ?? "in_progress",
  );
  const [notes, setNotes] = useState(entry?.goalOrNotes ?? "");
  const [date, setDate] = useState(entry?.date ?? todayKey());
  const [time, setTime] = useState("20:00");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(duration);
    if (!subject.trim()) {
      setError("请输入学科或学习方向。");
      return;
    }
    if (!content.trim()) {
      setError("请输入本次学习内容。");
      return;
    }
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setError("学习时长必须是大于 0 的整数。");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        subject: subject.trim(),
        content: content.trim(),
        durationMinutes: minutes,
        progress,
        goalOrNotes: notes.trim() || undefined,
        date: date as StudyEntry["date"],
        studiedAt: new Date(`${date}T${time}:00`).toISOString(),
      };
      if (entry) {
        await repositories.study.update(entry.id, payload);
        notify("学习记录已更新");
      } else {
        await repositories.study.create(payload);
        notify("学习记录已保存");
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
      title={entry ? "编辑学习记录" : "记录一次学习"}
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
          <Button type="submit" form="study-form" variant="primary" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="study-form" className="form" onSubmit={save}>
        <div className="fieldGrid">
          <label className="field">
            <span>学科或学习方向</span>
            <input
              value={subject}
              placeholder="阅读与写作"
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <label className="field">
            <span>学习时长（分钟）</span>
            <input
              type="number"
              min="1"
              step="1"
              value={duration}
              placeholder="30"
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>这次学了什么</span>
          <input
            value={content}
            placeholder="例如：《设计心理学》第 3 章"
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <div className="fieldGrid">
          <label className="field">
            <span>当前进度</span>
            <select
              value={progress}
              onChange={(event) => setProgress(event.target.value as StudyProgress)}
            >
              {Object.entries(PROGRESS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
              onChange={(event) => setDate(event.target.value as StudyEntry["date"])}
            />
          </label>
        </div>
        <label className="field">
          <span>学习时间</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
        <label className="field">
          <span>目标或笔记</span>
          <textarea
            rows={4}
            value={notes}
            placeholder="记下重点或还没想明白的问题"
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
