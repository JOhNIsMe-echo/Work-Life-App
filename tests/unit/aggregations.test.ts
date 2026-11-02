import { describe, expect, it } from "vitest";
import { summarizeHome } from "../../src/domain/aggregations";
import type {
  DietEntry,
  EntertainmentItem,
  FitnessEntry,
  MoodEntry,
  StudyEntry,
  Todo,
} from "../../src/domain/types";

const now = new Date(2026, 10, 1, 18);
const base = {
  createdAt: "2026-11-01T02:00:00.000Z",
  updatedAt: "2026-11-01T02:00:00.000Z",
};

describe("home aggregation", () => {
  it("summarizes today's records and caps the homepage todo list at three", () => {
    const todos: Todo[] = Array.from({ length: 5 }, (_, index) => ({
      ...base,
      id: `todo-${index}`,
      title: `任务 ${index}`,
      date: "2026-11-01",
      isImportant: false,
      completed: index === 4,
      createdAt: `2026-11-01T0${index}:00:00.000Z`,
    }));
    const fitnessEntries: FitnessEntry[] = [
      {
        ...base,
        id: "fit-1",
        activity: "跑步",
        durationMinutes: 30,
        date: "2026-11-01",
        performedAt: "2026-11-01T10:00:00.000Z",
      },
    ];
    const dietEntries: DietEntry[] = [
      {
        ...base,
        id: "diet-1",
        date: "2026-11-01",
        meal: "lunch",
        food: "沙拉",
        recordedAt: "2026-11-01T04:00:00.000Z",
      },
    ];
    const entertainmentItems: EntertainmentItem[] = [
      {
        ...base,
        id: "fun-1",
        title: "游戏",
        category: "game",
        status: "playing",
        totalMinutes: 30,
      },
    ];
    const studyEntries: StudyEntry[] = [
      {
        ...base,
        id: "study-1",
        date: "2026-11-01",
        subject: "阅读",
        content: "第三章",
        durationMinutes: 60,
        progress: "in_progress",
        studiedAt: "2026-11-01T12:00:00.000Z",
      },
    ];
    const moodEntries: MoodEntry[] = [
      {
        ...base,
        id: "mood-1",
        date: "2026-11-01",
        mood: "calm",
        tags: [],
        recordedAt: "2026-11-01T08:00:00.000Z",
      },
      {
        ...base,
        id: "mood-2",
        date: "2026-11-01",
        mood: "happy",
        tags: [],
        recordedAt: "2026-11-01T09:00:00.000Z",
      },
    ];

    const result = summarizeHome({
      todos,
      fitnessEntries,
      dietEntries,
      entertainmentItems,
      studyEntries,
      moodEntries,
      now,
    });

    expect(result.todos).toMatchObject({
      total: 5,
      completed: 1,
      incomplete: 4,
    });
    expect(result.todos.topIncomplete).toHaveLength(3);
    expect(result.fitness).toMatchObject({ count: 1, totalMinutes: 30 });
    expect(result.diet.recordedMeals).toEqual(["lunch"]);
    expect(result.entertainment.activeCount).toBe(1);
    expect(result.study).toMatchObject({ count: 1, totalMinutes: 60 });
    expect(result.mood.latest?.id).toBe("mood-2");
  });
});
