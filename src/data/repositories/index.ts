import type { InsertType, Table, UpdateSpec } from "dexie";
import { DEFAULT_PAGE_COLORS } from "../../domain/pageColors";
import type {
  AppSettings,
  DietEntry,
  EntertainmentItem,
  FitnessEntry,
  Memo,
  MoodEntry,
  StudyEntry,
  Todo,
} from "../../domain/types";
import { db as defaultDatabase } from "../db";
import type { WorkLifeDatabase } from "../db";
import { saveStatusStore, type SaveStatusStore } from "../saveStatus";

type NewRecord<T extends { id: string; createdAt: string; updatedAt: string }> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;
type RecordPatch<T> = Partial<Omit<T, "id" | "createdAt">>;

function nowIso(): string {
  return new Date().toISOString();
}

export class RecordRepository<
  T extends { id: string; createdAt: string; updatedAt: string },
> {
  constructor(
    protected readonly table: Table<T, string, InsertType<T, "id">>,
    private readonly saveStatus: SaveStatusStore,
  ) {}

  async get(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async list(): Promise<T[]> {
    return this.table.toArray();
  }

  async create(input: NewRecord<T>): Promise<T> {
    const timestamp = nowIso();
    const record = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as T;

    await this.saveStatus.run(() => this.table.add(record));
    return record;
  }

  async update(id: string, patch: RecordPatch<T>): Promise<T> {
    const updated = await this.saveStatus.run(async () => {
      await this.table.update(id, {
        ...patch,
        updatedAt: nowIso(),
      } as UpdateSpec<InsertType<T, "id">>);
      return this.table.get(id);
    });

    if (!updated) {
      throw new Error("要更新的记录不存在。");
    }

    return updated;
  }

  async remove(id: string): Promise<T | undefined> {
    return this.saveStatus.run(async () => {
      const existing = await this.table.get(id);
      if (existing) {
        await this.table.delete(id);
      }
      return existing;
    });
  }

  async restore(record: T): Promise<T> {
    await this.saveStatus.run(() => this.table.put(record));
    return record;
  }
}

export class TodoRepository extends RecordRepository<Todo> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.todos, saveStatus);
  }

  async forDate(date: string): Promise<Todo[]> {
    return this.table.where("date").equals(date).toArray();
  }

  async setCompleted(id: string, completed: boolean): Promise<Todo> {
    return this.update(id, {
      completed,
      completedAt: completed ? nowIso() : undefined,
    });
  }
}

export class MemoRepository extends RecordRepository<Memo> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.memos, saveStatus);
  }

  async ordered(): Promise<Memo[]> {
    return (await this.list()).toSorted(
      (left, right) =>
        Number(right.pinned) - Number(left.pinned) ||
        right.updatedAt.localeCompare(left.updatedAt),
    );
  }
}

export class FitnessRepository extends RecordRepository<FitnessEntry> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.fitnessEntries, saveStatus);
  }

  async forDate(date: string): Promise<FitnessEntry[]> {
    return this.table.where("date").equals(date).toArray();
  }
}

export class DietRepository extends RecordRepository<DietEntry> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.dietEntries, saveStatus);
  }

  async forDate(date: string): Promise<DietEntry[]> {
    return this.table.where("date").equals(date).toArray();
  }
}

export class EntertainmentRepository extends RecordRepository<EntertainmentItem> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.entertainmentItems, saveStatus);
  }

  async ordered(): Promise<EntertainmentItem[]> {
    return (await this.list()).toSorted(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        right.updatedAt.localeCompare(left.updatedAt),
    );
  }
}

export class StudyRepository extends RecordRepository<StudyEntry> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.studyEntries, saveStatus);
  }

  async forDate(date: string): Promise<StudyEntry[]> {
    return this.table.where("date").equals(date).toArray();
  }
}

export class MoodRepository extends RecordRepository<MoodEntry> {
  constructor(
    database: WorkLifeDatabase,
    saveStatus: SaveStatusStore = saveStatusStore,
  ) {
    super(database.moodEntries, saveStatus);
  }

  async forDate(date: string): Promise<MoodEntry[]> {
    return this.table.where("date").equals(date).toArray();
  }
}

export class SettingsRepository {
  constructor(
    private readonly database: WorkLifeDatabase,
    private readonly saveStatus: SaveStatusStore,
  ) {}

  defaults(): AppSettings {
    const timestamp = nowIso();
    return {
      id: "app",
      createdAt: timestamp,
      updatedAt: timestamp,
      theme: "system",
      todoSort: "importance",
      pageColors: { ...DEFAULT_PAGE_COLORS },
    };
  }

  async read(): Promise<AppSettings | undefined> {
    return this.database.settings.get("app");
  }

  async get(): Promise<AppSettings> {
    const existing = await this.read();
    if (existing) {
      return existing;
    }

    const created = this.defaults();
    await this.saveStatus.run(() => this.database.settings.put(created));
    return created;
  }

  async update(patch: Partial<Omit<AppSettings, "id" | "createdAt">>) {
    const existing = await this.get();
    const updated: AppSettings = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    };
    await this.saveStatus.run(() => this.database.settings.put(updated));
    return updated;
  }
}

export function createRepositories(
  database: WorkLifeDatabase = defaultDatabase,
  saveStatus: SaveStatusStore = saveStatusStore,
) {
  return {
    todos: new TodoRepository(database, saveStatus),
    memos: new MemoRepository(database, saveStatus),
    fitness: new FitnessRepository(database, saveStatus),
    diet: new DietRepository(database, saveStatus),
    entertainment: new EntertainmentRepository(database, saveStatus),
    study: new StudyRepository(database, saveStatus),
    mood: new MoodRepository(database, saveStatus),
    settings: new SettingsRepository(database, saveStatus),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

export const repositories = createRepositories();
