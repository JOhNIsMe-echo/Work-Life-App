import { addDays, differenceInCalendarDays, format, startOfWeek } from "date-fns";
import type { LocalDate, Todo } from "./types";

export function localDateKey(date: Date = new Date()): LocalDate {
  return format(date, "yyyy-MM-dd") as LocalDate;
}

export function todayKey(now: Date = new Date()): LocalDate {
  return localDateKey(now);
}

export function weekRange(now: Date = new Date()): {
  start: LocalDate;
  end: LocalDate;
} {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  return {
    start: localDateKey(start),
    end: localDateKey(addDays(start, 6)),
  };
}

export function recentDateKeys(days: number, now: Date = new Date()): LocalDate[] {
  const safeDays = Math.max(1, Math.floor(days));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Array.from({ length: safeDays }, (_, index) =>
    localDateKey(addDays(today, index - safeDays + 1)),
  );
}

export function isTodoOverdue(todo: Todo, now: Date = new Date()): boolean {
  if (todo.completed) {
    return false;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(`${todo.date}T00:00:00`);
  return differenceInCalendarDays(today, taskDate) > 0;
}

export function isDateInRange(
  date: LocalDate,
  start: LocalDate,
  end: LocalDate,
): boolean {
  return date >= start && date <= end;
}

export function formatChineseDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}
