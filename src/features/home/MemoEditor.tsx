import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import type { Memo } from "../../domain/types";

type MemoEditorProps = {
  open: boolean;
  memo: Memo | null;
  onClose: () => void;
  onDelete: (memo: Memo) => Promise<void>;
};

export function MemoEditor({ open, memo, onClose, onDelete }: MemoEditorProps) {
  const { notify } = useToast();
  const [content, setContent] = useState(memo?.content ?? "");
  const [pinned, setPinned] = useState(memo?.pinned ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError("请输入备忘内容。");
      return;
    }

    setSaving(true);
    try {
      if (memo) {
        await repositories.memos.update(memo.id, {
          content: trimmed,
          pinned,
        });
        notify("备忘已更新");
      } else {
        await repositories.memos.create({ content: trimmed, pinned });
        notify("备忘已保存");
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
      title={memo ? "编辑备忘" : "写一条备忘"}
      onClose={onClose}
      footer={
        <div className="footer">
          {memo ? (
            <Button
              variant="danger"
              onClick={() => void onDelete(memo)}
              disabled={saving}
            >
              删除
            </Button>
          ) : null}
          <span style={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button variant="primary" type="submit" form="memo-form" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      }
    >
      <form id="memo-form" className="form" onSubmit={save}>
        <label className="field">
          <span>备忘内容</span>
          <textarea
            rows={6}
            value={content}
            placeholder="随手记下，不用担心格式"
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <label className="checkRow">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
          />
          固定到首页顶部
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
