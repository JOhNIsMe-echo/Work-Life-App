import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type { Todo } from "../../domain/types";

type TodoEditorProps = {
  open: boolean;
  todo: Todo | null;
  onClose: () => void;
  onDelete: (todo: Todo) => Promise<void>;
};

export function TodoEditor({ open, todo, onClose, onDelete }: TodoEditorProps) {
  const { notify } = useToast();
  const [title, setTitle] = useState(todo?.title ?? "");
  const [notes, setNotes] = useState(todo?.notes ?? "");
  const [important, setImportant] = useState(todo?.isImportant ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("请输入待办内容。");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        notes: notes.trim() || undefined,
        isImportant: important,
      };
      if (todo) {
        await repositories.todos.update(todo.id, payload);
        notify("待办已更新");
      } else {
        await repositories.todos.create({
          ...payload,
          date: todayKey(),
          completed: false,
        });
        notify("待办已添加");
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
      title={todo ? "编辑待办" : "新建今日待办"}
      onClose={onClose}
      footer={
        <div className="footer">
          {todo ? (
            <Button
              variant="danger"
              onClick={() => void onDelete(todo)}
              disabled={saving}
            >
              删除
            </Button>
          ) : null}
          <span style={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form="todo-form" variant="primary" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="todo-form" className="form" onSubmit={save}>
        <label className="field">
          <span>要做的事</span>
          <input
            value={title}
            placeholder="例如：整理周报资料"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="field">
          <span>补充说明</span>
          <textarea
            rows={4}
            value={notes}
            placeholder="可不填"
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="checkRow">
          <input
            type="checkbox"
            checked={important}
            onChange={(event) => setImportant(event.target.checked)}
          />
          标记为重要事项
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
