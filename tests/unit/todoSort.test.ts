import { describe, expect, it } from "vitest";
import { sortTodos } from "../../src/domain/todoSort";
import type { Todo } from "../../src/domain/types";

function makeTodo(title: string, createdAt: string, isImportant = false): Todo {
  return {
    id: title,
    title,
    date: "2026-11-02",
    isImportant,
    completed: false,
    createdAt,
    updatedAt: createdAt,
  };
}

const todos = [
  makeTodo("B 普通", "2026-11-02T02:00:00.000Z"),
  makeTodo("A 重要", "2026-11-02T01:00:00.000Z", true),
  makeTodo("C 普通", "2026-11-02T03:00:00.000Z"),
];

describe("todo sorting", () => {
  it("puts important items first, then newest", () => {
    expect(sortTodos(todos, "importance").map((todo) => todo.title)).toEqual([
      "A 重要",
      "C 普通",
      "B 普通",
    ]);
  });

  it("sorts by newest creation time", () => {
    expect(sortTodos(todos, "newest").map((todo) => todo.title)).toEqual([
      "C 普通",
      "B 普通",
      "A 重要",
    ]);
  });

  it("sorts by Chinese-aware title order without mutating input", () => {
    const titles = sortTodos(todos, "title").map((todo) => todo.title);
    expect(titles).toEqual(["A 重要", "B 普通", "C 普通"]);
    expect(todos.map((todo) => todo.title)).toEqual(["B 普通", "A 重要", "C 普通"]);
  });
});
