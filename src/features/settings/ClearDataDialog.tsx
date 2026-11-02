import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { EditDrawer } from "../../components/EditDrawer/EditDrawer";
import { useToast } from "../../components/Toast/ToastContext";
import { db } from "../../data/db";
import { clearRecords } from "../../lib/backup";
import styles from "./SettingsPage.module.css";

type ClearDataDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ClearDataDialog({ open, onClose }: ClearDataDialogProps) {
  const { notify } = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  async function clear() {
    if (confirmation !== "清空") {
      setError("请输入“清空”后继续。");
      return;
    }

    setClearing(true);
    try {
      await clearRecords(db);
      notify("个人记录已清空，外观设置已保留");
      onClose();
    } catch {
      setError("清空失败，当前数据未被更改。");
    } finally {
      setClearing(false);
    }
  }

  return (
    <EditDrawer
      open={open}
      title="确定要清空全部数据吗？"
      eyebrow="不可撤销操作"
      onClose={onClose}
      footer={
        <div className="footer">
          <Button onClick={onClose} disabled={clearing}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => void clear()}
            disabled={clearing || confirmation !== "清空"}
          >
            {clearing ? "正在清空…" : "确认清空"}
          </Button>
        </div>
      }
    >
      <div className={styles.dangerCallout}>
        所有待办、备忘、健身、饮食、娱乐、学习和心情记录都会被删除。外观和页面颜色会保留。建议先导出备份。
      </div>
      <label className="field">
        <span>请输入“清空”确认</span>
        <input
          value={confirmation}
          placeholder="清空"
          onChange={(event) => {
            setConfirmation(event.target.value);
            setError("");
          }}
        />
      </label>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </EditDrawer>
  );
}
