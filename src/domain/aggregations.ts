import { todayKey } from "./dates";
import type {
  DietEntry,
  EntertainmentItem,
  FitnessEntry,
  HomeSummary,
  MealType,
  MoodEntry,
  StudyEntry,
  Todo,
} from "./types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function newestFirst<T extends { createdAt: string }>(left: T, right: T): number {
  return right.createdAt.localeCompare(left.createdAt);
}

export function summarizeHome(input: {
  todos: Todo[];
  fitnessEntries: FitnessEntry[];
  dietEntries: DietEntry[];
  entertainmentItems: EntertainmentItem[];
  studyEntries: StudyEntry[];
  moodEntries: MoodEntry[];
  now?: Date;
}): HomeSummary {
  const today = todayKey(input.now);
  const todos = input.todos.filter((todo) => todo.date === today);
  const completed = todos.filter((todo) => todo.completed).length;
  const incomplete = todos.filter((todo) => !todo.completed);
  const fitness = input.fitnessEntries
    .filter((entry) => entry.date === today)
    .toSorted((left, right) => right.performedAt.localeCompare(left.performedAt));
  const diet = input.dietEntries
    .filter((entry) => entry.date === today)
    .toSorted((left, right) =>
      (right.recordedAt ?? right.createdAt).localeCompare(
        left.recordedAt ?? left.createdAt,
      ),
    );
  const activeEntertainment = input.entertainmentItems
    .filter((item) => item.status === "playing")
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const study = input.studyEntries.filter((entry) => entry.date === today);
  const moods = input.moodEntries
    .filter((entry) => entry.date === today)
    .toSorted((left, right) => right.recordedAt.localeCompare(left.recordedAt));

  return {
    todos: {
      total: todos.length,
      completed,
      incomplete: incomplete.length,
      topIncomplete: incomplete.toSorted(newestFirst).slice(0, 3),
    },
    fitness: {
      count: fitness.length,
      totalMinutes: fitness.reduce((total, entry) => total + entry.durationMinutes, 0),
      latest: fitness[0] ?? null,
    },
    diet: {
      recordedMeals: MEAL_ORDER.filter((meal) =>
        diet.some((entry) => entry.meal === meal),
      ),
      latest: diet[0] ?? null,
    },
    entertainment: {
      activeCount: activeEntertainment.length,
      latestActive: activeEntertainment[0] ?? null,
    },
    study: {
      count: study.length,
      totalMinutes: study.reduce((total, entry) => total + entry.durationMinutes, 0),
    },
    mood: {
      latest: moods[0] ?? null,
    },
  };
}
