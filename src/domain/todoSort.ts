import type { Todo, TodoSort } from "./types";

export const TODO_SORT_LABELS: Record<TodoSort, string> = {
  importance: "重要性优先",
  newest: "最近创建",
  title: "按名称",
};

export function sortTodos(todos: Todo[], sort: TodoSort): Todo[] {
  return todos.toSorted((left, right) => {
    if (sort === "title") {
      return left.title.localeCompare(right.title, "zh-CN");
    }
    if (sort === "newest") {
      return right.createdAt.localeCompare(left.createdAt);
    }
    return (
      Number(right.isImportant) - Number(left.isImportant) ||
      right.createdAt.localeCompare(left.createdAt)
    );
  });
}
