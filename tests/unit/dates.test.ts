import { describe, expect, it } from "vitest";
import {
  isTodoOverdue,
  localDateKey,
  recentDateKeys,
  weekRange,
} from "../../src/domain/dates";
import type { Todo } from "../../src/domain/types";

function makeTodo(date: string, completed = false): Todo {
  return {
    id: crypto.randomUUID(),
    title: "测试待办",
    date: date as Todo["date"],
    isImportant: false,
    completed,
    createdAt: "2026-11-01T01:00:00.000Z",
    updatedAt: "2026-11-01T01:00:00.000Z",
  };
}

describe("date rules", () => {
  it("uses a local calendar date instead of slicing a UTC timestamp", () => {
    const now = new Date(2026, 10, 2, 0, 30);
    expect(localDateKey(now)).toBe("2026-11-02");
  });

  it("returns Monday through Sunday for the current week", () => {
    const now = new Date(2026, 10, 1, 12);
    expect(weekRange(now)).toEqual({
      start: "2026-10-26",
      end: "2026-11-01",
    });
  });

  it("returns seven recent dates in ascending order", () => {
    expect(recentDateKeys(7, new Date(2026, 10, 1, 12))).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("moves an incomplete previous-day todo into overdue", () => {
    const now = new Date(2026, 10, 2, 8);
    expect(isTodoOverdue(makeTodo("2026-11-01"), now)).toBe(true);
    expect(isTodoOverdue(makeTodo("2026-11-02"), now)).toBe(false);
    expect(isTodoOverdue(makeTodo("2026-11-01", true), now)).toBe(false);
  });
});
