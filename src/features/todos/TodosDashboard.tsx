import { useLiveQuery } from "dexie-react-hooks";
import { CalendarX2, CircleCheckBig, Flag, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { isTodoOverdue, todayKey } from "../../domain/dates";
import type { Todo } from "../../domain/types";
import { TodoEditor } from "./TodoEditor";
import { TodoTaskRow } from "./TodoTaskRow";
import styles from "./TodosPage.module.css";

type Filter = "all" | "pending" | "overdue" | "done";

const FILTER_LABELS: Record<Filter, string> = {
  all: "全部",
  pending: "待完成",
  overdue: "已逾期",
  done: "已完成",
};

export function TodosDashboard() {
  const { notify, notifyUndo } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const todos = useLiveQuery(() => repositories.todos.list(), [], []);
  const today = todayKey();

  const groups = useMemo(() => {
    const overdue = todos
      .filter((todo) => isTodoOverdue(todo))
      .toSorted((left, right) => left.date.localeCompare(right.date));
    const pending = todos
      .filter((todo) => !todo.completed && !isTodoOverdue(todo))
      .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt));
    const done = todos
      .filter((todo) => todo.completed)
      .toSorted((left, right) =>
        (right.completedAt ?? right.updatedAt).localeCompare(
          left.completedAt ?? left.updatedAt,
        ),
      );
    return { pending, overdue, done };
  }, [todos]);

  const visibleGroups = (
    [
      { key: "pending" as const, title: "今天待完成", items: groups.pending },
      { key: "overdue" as const, title: "已逾期", items: groups.overdue },
      { key: "done" as const, title: "已完成", items: groups.done },
    ] satisfies Array<{ key: Filter; title: string; items: Todo[] }>
  ).filter((group) => filter === "all" || filter === group.key);

  async function toggle(todo: Todo) {
    try {
      await repositories.todos.setCompleted(todo.id, !todo.completed);
      notify(todo.completed ? "待办已恢复" : "待办已完成");
    } catch {
      notify("待办更新失败，请重试");
    }
  }

  function openEditor(todo?: Todo) {
    setEditingTodo(todo ?? null);
    setEditorOpen(true);
  }

  async function remove(todo: Todo) {
    try {
      const removed = await repositories.todos.remove(todo.id);
      setEditorOpen(false);
      if (removed) {
        notifyUndo("待办已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.todos.restore(removed);
          },
        });
      }
    } catch {
      notify("删除失败，请重试");
    }
  }

  const todayTodos = todos.filter((todo) => todo.date === today);
  const completedToday = todayTodos.filter((todo) => todo.completed).length;

  return (
    <>
      <PageHeader
        eyebrow="今天的事情，清楚一点就好"
        title="今日待办"
        description="未完成的事情会在第二天自动归入逾期，不会悄悄消失。"
        action={
          <Button variant="primary" onClick={() => openEditor()}>
            <Plus size={16} aria-hidden="true" />
            新建待办
          </Button>
        }
      />

      <div className={styles.summary}>
        <div>
          <span>待完成</span>
          <strong>{groups.pending.length + groups.overdue.length}</strong>
        </div>
        <div className={styles.completion}>
          <div>
            <span>今天的完成度</span>
            <strong>
              {todayTodos.length === 0
                ? "0%"
                : `${Math.round((completedToday / todayTodos.length) * 100)}%`}
            </strong>
          </div>
          <div className={styles.progress} aria-hidden="true">
            <span
              style={{
                width:
                  todayTodos.length === 0
                    ? "0%"
                    : `${(completedToday / todayTodos.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div>
          <span>重要事项</span>
          <strong>
            {todos.filter((todo) => todo.isImportant && !todo.completed).length}
          </strong>
        </div>
      </div>

      <div className={styles.filters} role="group" aria-label="筛选待办">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => {
          const count =
            key === "all"
              ? todos.length
              : key === "pending"
                ? groups.pending.length
                : key === "overdue"
                  ? groups.overdue.length
                  : groups.done.length;
          return (
            <button
              key={key}
              type="button"
              className={filter === key ? styles.selected : ""}
              onClick={() => setFilter(key)}
            >
              {FILTER_LABELS[key]} <span>{count}</span>
            </button>
          );
        })}
      </div>

      {todos.length === 0 ? (
        <EmptyState
          icon={CircleCheckBig}
          title="今天还没有待办"
          description="先记下一件真正想完成的事情，不需要一次安排很多。"
          action={
            <Button variant="primary" onClick={() => openEditor()}>
              <Plus size={15} aria-hidden="true" />
              添加第一项
            </Button>
          }
        />
      ) : (
        <div className={styles.groups}>
          {visibleGroups.map((group) =>
            group.items.length > 0 ? (
              <section key={group.key}>
                <div className={styles.groupHead}>
                  <h2>{group.title}</h2>
                  <span>{group.items.length} 项</span>
                </div>
                <div className={styles.taskList}>
                  {group.items.map((todo) => (
                    <TodoTaskRow
                      key={todo.id}
                      todo={todo}
                      overdue={group.key === "overdue"}
                      onToggle={(item) => void toggle(item)}
                      onEdit={openEditor}
                    />
                  ))}
                </div>
              </section>
            ) : null,
          )}
          {visibleGroups.every((group) => group.items.length === 0) ? (
            <EmptyState
              icon={filter === "overdue" ? CalendarX2 : Flag}
              title="这个分类里暂时没有待办"
              description="切换其他筛选，或添加一项新的待办。"
            />
          ) : null}
        </div>
      )}

      {editorOpen ? (
        <TodoEditor
          key={editingTodo?.id ?? "new-todo"}
          open
          todo={editingTodo}
          onClose={() => setEditorOpen(false)}
          onDelete={remove}
        />
      ) : null}
    </>
  );
}
