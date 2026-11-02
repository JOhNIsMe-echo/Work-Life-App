import { Check, Pencil } from "lucide-react";
import type { Todo } from "../../domain/types";
import styles from "./TodosPage.module.css";

type TodoTaskRowProps = {
  todo: Todo;
  overdue: boolean;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
};

export function TodoTaskRow({ todo, overdue, onToggle, onEdit }: TodoTaskRowProps) {
  return (
    <article
      className={`${styles.taskRow} ${overdue ? styles.overdue : ""} ${
        todo.completed ? styles.done : ""
      }`}
    >
      <button
        type="button"
        className={styles.taskCheck}
        aria-label={
          todo.completed ? `恢复待办：${todo.title}` : `完成待办：${todo.title}`
        }
        onClick={() => onToggle(todo)}
      >
        {todo.completed ? <Check size={13} aria-hidden="true" /> : null}
      </button>
      <div className={styles.taskMain}>
        <strong>{todo.title}</strong>
        {todo.notes ? <p>{todo.notes}</p> : null}
        <div className={styles.taskMeta}>
          {todo.isImportant ? <b>重要</b> : null}
          <span>{todo.date}</span>
          {overdue ? <b className={styles.warning}>已逾期</b> : null}
        </div>
      </div>
      <button
        type="button"
        className={styles.editButton}
        aria-label={`编辑待办：${todo.title}`}
        onClick={() => onEdit(todo)}
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
    </article>
  );
}
