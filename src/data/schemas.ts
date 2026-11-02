import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pageColor = z.string().regex(/^#[0-9a-f]{6}$/i);

const baseRecord = {
  id: z.string().min(1),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
};

export const todoSchema = z.object({
  ...baseRecord,
  title: z.string().trim().min(1),
  date: localDate,
  isImportant: z.boolean(),
  notes: z.string().optional(),
  completed: z.boolean(),
  completedAt: isoDateTime.optional(),
});

export const memoSchema = z.object({
  ...baseRecord,
  content: z.string().trim().min(1),
  pinned: z.boolean(),
});

export const fitnessEntrySchema = z.object({
  ...baseRecord,
  activity: z.string().trim().min(1),
  durationMinutes: z.number().int().positive(),
  calories: z.number().nonnegative().optional(),
  date: localDate,
  performedAt: isoDateTime,
  feeling: z.string().optional(),
});

export const dietEntrySchema = z.object({
  ...baseRecord,
  date: localDate,
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  food: z.string().trim().min(1),
  portion: z.string().optional(),
  recordedAt: isoDateTime.optional(),
  notes: z.string().optional(),
});

export const entertainmentItemSchema = z.object({
  ...baseRecord,
  title: z.string().trim().min(1),
  category: z.enum(["game", "movie", "series", "other"]),
  status: z.enum(["wanted", "playing", "completed", "paused"]),
  totalMinutes: z.number().int().nonnegative(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export const studyEntrySchema = z.object({
  ...baseRecord,
  date: localDate,
  subject: z.string().trim().min(1),
  content: z.string().trim().min(1),
  durationMinutes: z.number().int().positive(),
  progress: z.enum(["started", "in_progress", "completed"]),
  goalOrNotes: z.string().optional(),
  studiedAt: isoDateTime,
});

export const moodEntrySchema = z.object({
  ...baseRecord,
  date: localDate,
  mood: z.enum(["happy", "calm", "tired", "anxious", "low"]),
  tags: z.array(z.string().trim().min(1)).max(8),
  note: z.string().optional(),
  recordedAt: isoDateTime,
});

export const pageColorsSchema = z.object({
  home: pageColor,
  todo: pageColor,
  fitness: pageColor,
  diet: pageColor,
  fun: pageColor,
  study: pageColor,
  mood: pageColor,
  data: pageColor,
});

export const appSettingsSchema = z.object({
  ...baseRecord,
  id: z.literal("app"),
  theme: z.enum(["system", "light", "dark"]),
  pageColors: pageColorsSchema,
  lastBackupAt: isoDateTime.optional(),
});

export const appDataSchema = z.object({
  todos: z.array(todoSchema),
  memos: z.array(memoSchema),
  fitnessEntries: z.array(fitnessEntrySchema),
  dietEntries: z.array(dietEntrySchema),
  entertainmentItems: z.array(entertainmentItemSchema),
  studyEntries: z.array(studyEntrySchema),
  moodEntries: z.array(moodEntrySchema),
  settings: appSettingsSchema,
});
