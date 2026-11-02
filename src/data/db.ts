import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  DietEntry,
  EntertainmentItem,
  FitnessEntry,
  Memo,
  MoodEntry,
  StudyEntry,
  Todo,
} from "../domain/types";

export class WorkLifeDatabase extends Dexie {
  todos!: EntityTable<Todo, "id">;
  memos!: EntityTable<Memo, "id">;
  fitnessEntries!: EntityTable<FitnessEntry, "id">;
  dietEntries!: EntityTable<DietEntry, "id">;
  entertainmentItems!: EntityTable<EntertainmentItem, "id">;
  studyEntries!: EntityTable<StudyEntry, "id">;
  moodEntries!: EntityTable<MoodEntry, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor(name = "personal-work-life") {
    super(name);

    this.version(1).stores({
      todos: "id, date, completed, updatedAt",
      memos: "id, pinned, updatedAt",
      fitnessEntries: "id, date, performedAt",
      dietEntries: "id, date, meal",
      entertainmentItems: "id, status, updatedAt",
      studyEntries: "id, date, subject",
      moodEntries: "id, date, recordedAt",
      settings: "id",
    });
  }
}

export const db = new WorkLifeDatabase();
