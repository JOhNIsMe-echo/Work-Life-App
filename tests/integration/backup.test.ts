import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkLifeDatabase } from "../../src/data/db";
import { DEFAULT_PAGE_COLORS } from "../../src/domain/pageColors";
import type { AppData } from "../../src/domain/types";
import {
  clearRecords,
  countData,
  createBackup,
  parseBackup,
  readAllData,
  replaceAllData,
} from "../../src/lib/backup";

let database: WorkLifeDatabase;

function makeData(id: string): AppData {
  const timestamp = "2026-11-01T08:00:00.000Z";
  return {
    todos: [
      {
        id: `todo-${id}`,
        title: "备份待办",
        date: "2026-11-01",
        isImportant: true,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    memos: [
      {
        id: `memo-${id}`,
        content: "备份备忘",
        pinned: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    fitnessEntries: [
      {
        id: `fitness-${id}`,
        activity: "跑步",
        durationMinutes: 30,
        date: "2026-11-01",
        performedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    dietEntries: [
      {
        id: `diet-${id}`,
        date: "2026-11-01",
        meal: "lunch",
        food: "沙拉",
        price: 18.5,
        recordedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    entertainmentItems: [
      {
        id: `fun-${id}`,
        title: "游戏",
        category: "game",
        status: "playing",
        date: "2026-11-01",
        totalMinutes: 60,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    studyEntries: [
      {
        id: `study-${id}`,
        date: "2026-11-01",
        subject: "阅读",
        content: "第三章",
        durationMinutes: 45,
        progress: "in_progress",
        studiedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    moodEntries: [
      {
        id: `mood-${id}`,
        date: "2026-11-01",
        mood: "calm",
        tags: ["平静"],
        recordedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    settings: {
      id: "app",
      theme: "dark",
      todoSort: "importance",
      pageColors: {
        ...DEFAULT_PAGE_COLORS,
        home: "#123456",
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

beforeEach(() => {
  database = new WorkLifeDatabase(`backup-test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await database.delete();
});

describe("backup and restore", () => {
  it("counts every module and round-trips a versioned backup", async () => {
    const source = makeData("source");
    const backup = createBackup(source, new Date("2026-11-01T10:00:00.000Z"));
    expect(backup.counts).toEqual(countData(source));

    await replaceAllData(database, source);
    const raw = await readAllData(database);
    const parsed = parseBackup(JSON.stringify(createBackup(raw)));
    expect(parsed.data.todos[0]?.title).toBe("备份待办");
    expect(parsed.data.dietEntries[0]?.price).toBe(18.5);
    expect(parsed.data.settings.pageColors.home).toBe("#123456");
  });

  it("rejects invalid JSON, incompatible versions, and duplicate IDs", () => {
    const source = makeData("invalid");
    const valid = createBackup(source);

    expect(() => parseBackup("{not-json")).toThrow("有效的 JSON");
    expect(() => parseBackup(JSON.stringify({ ...valid, version: 99 }))).toThrow(
      "格式不正确",
    );

    const duplicated = {
      ...valid,
      counts: { ...valid.counts, todos: 2 },
      data: {
        ...valid.data,
        todos: [valid.data.todos[0], valid.data.todos[0]],
      },
    };
    expect(() => parseBackup(JSON.stringify(duplicated))).toThrow("重复记录");
  });

  it("upgrades version 1 backups by deriving entertainment dates", () => {
    const source = makeData("legacy");
    const legacyEntertainment = {
      ...source.entertainmentItems[0]!,
    } as Record<string, unknown>;
    delete legacyEntertainment.date;
    const legacy = {
      ...createBackup(source),
      version: 1,
      data: {
        ...source,
        entertainmentItems: [legacyEntertainment],
      },
    };

    const parsed = parseBackup(JSON.stringify(legacy));
    expect(parsed.version).toBe(2);
    expect(parsed.data.entertainmentItems[0]?.date).toBe("2026-11-01");
  });

  it("replaces the previous data atomically and preserves settings on clear", async () => {
    await replaceAllData(database, makeData("first"));
    await replaceAllData(database, makeData("second"));
    const restored = await readAllData(database);
    expect(restored.todos[0]?.id).toBe("todo-second");
    expect(restored.settings.theme).toBe("dark");

    await clearRecords(database);
    const cleared = await readAllData(database);
    expect(cleared.todos).toHaveLength(0);
    expect(cleared.moodEntries).toHaveLength(0);
    expect(cleared.settings.pageColors.home).toBe("#123456");
  });
});
