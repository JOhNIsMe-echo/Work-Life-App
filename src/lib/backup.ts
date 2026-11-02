import { z } from "zod";
import type { WorkLifeDatabase } from "../data/db";
import {
  appDataSchema,
  appSettingsSchema,
  entertainmentItemSchema,
} from "../data/schemas";
import { localDateKey } from "../domain/dates";
import type { AppData, AppSettings, EntertainmentItem } from "../domain/types";

const moduleCountsSchema = z.object({
  todos: z.number().int().nonnegative(),
  memos: z.number().int().nonnegative(),
  fitnessEntries: z.number().int().nonnegative(),
  dietEntries: z.number().int().nonnegative(),
  entertainmentItems: z.number().int().nonnegative(),
  studyEntries: z.number().int().nonnegative(),
  moodEntries: z.number().int().nonnegative(),
});

export type ModuleCounts = z.infer<typeof moduleCountsSchema>;

const backupEnvelope = {
  format: z.literal("worklife-backup"),
  exportedAt: z.string().datetime({ offset: true }),
  counts: moduleCountsSchema,
};

const legacyAppDataSchema = appDataSchema.extend({
  entertainmentItems: z.array(entertainmentItemSchema.omit({ date: true })),
});

export const backupSchema = z.discriminatedUnion("version", [
  z.object({
    ...backupEnvelope,
    version: z.literal(1),
    data: legacyAppDataSchema,
  }),
  z.object({
    ...backupEnvelope,
    version: z.literal(2),
    data: appDataSchema,
  }),
]);

export type BackupFile = {
  format: "worklife-backup";
  version: 2;
  exportedAt: string;
  counts: ModuleCounts;
  data: AppData;
};

export type BackupPreview = {
  exportedAt: string;
  counts: ModuleCounts;
};

export function countData(data: Omit<AppData, "settings">): ModuleCounts {
  return {
    todos: data.todos.length,
    memos: data.memos.length,
    fitnessEntries: data.fitnessEntries.length,
    dietEntries: data.dietEntries.length,
    entertainmentItems: data.entertainmentItems.length,
    studyEntries: data.studyEntries.length,
    moodEntries: data.moodEntries.length,
  };
}

export function createBackup(data: AppData, exportedAt = new Date()): BackupFile {
  const counts = countData(data);
  return {
    format: "worklife-backup",
    version: 2,
    exportedAt: exportedAt.toISOString(),
    counts,
    data,
  };
}

function hasDuplicateIds(data: AppData): boolean {
  const collections = [
    data.todos,
    data.memos,
    data.fitnessEntries,
    data.dietEntries,
    data.entertainmentItems,
    data.studyEntries,
    data.moodEntries,
  ];
  return collections.some(
    (records) => new Set(records.map((record) => record.id)).size !== records.length,
  );
}

export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("备份文件不是有效的 JSON。");
  }

  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("备份文件格式不正确或版本不兼容。");
  }
  let data: AppData;
  if (parsed.data.version === 1) {
    data = {
      ...(parsed.data.data as Omit<AppData, "entertainmentItems">),
      entertainmentItems: parsed.data.data.entertainmentItems.map((item) => ({
        ...item,
        date: localDateKey(new Date(item.createdAt)) as EntertainmentItem["date"],
      })) as EntertainmentItem[],
    };
  } else {
    data = parsed.data.data as AppData;
  }
  if (hasDuplicateIds(data)) {
    throw new Error("备份文件包含重复记录，无法安全恢复。");
  }

  const actualCounts = countData(data);
  if (JSON.stringify(actualCounts) !== JSON.stringify(parsed.data.counts)) {
    throw new Error("备份文件的记录数量与内容不一致。");
  }

  return {
    ...parsed.data,
    version: 2,
    data,
  };
}

export function browseBackup(backup: BackupFile): BackupPreview {
  return {
    exportedAt: backup.exportedAt,
    counts: backup.counts,
  };
}

export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `worklife-backup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`;
}

export async function readAllData(database: WorkLifeDatabase): Promise<AppData> {
  const [
    todos,
    memos,
    fitnessEntries,
    dietEntries,
    entertainmentItems,
    studyEntries,
    moodEntries,
    settings,
  ] = await Promise.all([
    database.todos.toArray(),
    database.memos.toArray(),
    database.fitnessEntries.toArray(),
    database.dietEntries.toArray(),
    database.entertainmentItems.toArray(),
    database.studyEntries.toArray(),
    database.moodEntries.toArray(),
    database.settings.get("app"),
  ]);

  if (!settings) {
    throw new Error("应用设置尚未初始化。");
  }

  return {
    todos,
    memos,
    fitnessEntries,
    dietEntries,
    entertainmentItems,
    studyEntries,
    moodEntries,
    settings,
  };
}

export async function replaceAllData(
  database: WorkLifeDatabase,
  data: AppData,
): Promise<void> {
  await database.transaction(
    "rw",
    [
      database.todos,
      database.memos,
      database.fitnessEntries,
      database.dietEntries,
      database.entertainmentItems,
      database.studyEntries,
      database.moodEntries,
      database.settings,
    ],
    async () => {
      await Promise.all([
        database.todos.clear(),
        database.memos.clear(),
        database.fitnessEntries.clear(),
        database.dietEntries.clear(),
        database.entertainmentItems.clear(),
        database.studyEntries.clear(),
        database.moodEntries.clear(),
        database.settings.clear(),
      ]);
      await Promise.all([
        database.todos.bulkAdd(data.todos),
        database.memos.bulkAdd(data.memos),
        database.fitnessEntries.bulkAdd(data.fitnessEntries),
        database.dietEntries.bulkAdd(data.dietEntries),
        database.entertainmentItems.bulkAdd(data.entertainmentItems),
        database.studyEntries.bulkAdd(data.studyEntries),
        database.moodEntries.bulkAdd(data.moodEntries),
        database.settings.add(data.settings),
      ]);
    },
  );
}

export async function clearRecords(database: WorkLifeDatabase): Promise<void> {
  await database.transaction(
    "rw",
    [
      database.todos,
      database.memos,
      database.fitnessEntries,
      database.dietEntries,
      database.entertainmentItems,
      database.studyEntries,
      database.moodEntries,
    ],
    async () => {
      await Promise.all([
        database.todos.clear(),
        database.memos.clear(),
        database.fitnessEntries.clear(),
        database.dietEntries.clear(),
        database.entertainmentItems.clear(),
        database.studyEntries.clear(),
        database.moodEntries.clear(),
      ]);
    },
  );
}

export function touchLastBackup(settings: AppSettings, at = new Date()): AppSettings {
  const parsed = appSettingsSchema.parse({
    ...settings,
    lastBackupAt: at.toISOString(),
    updatedAt: at.toISOString(),
  });
  return parsed;
}

export function downloadJsonFile(contents: string, filename: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
