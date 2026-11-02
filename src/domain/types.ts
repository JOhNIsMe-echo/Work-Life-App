export type PageKey =
  "home" | "todo" | "fitness" | "diet" | "fun" | "study" | "mood" | "data";

export type ThemeMode = "system" | "light" | "dark";
export type TodoSort = "importance" | "newest" | "title";
export type LocalDate = `${number}-${number}-${number}`;
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type EntertainmentCategory = "game" | "movie" | "series" | "other";
export type EntertainmentStatus = "wanted" | "playing" | "completed" | "paused";
export type StudyProgress = "started" | "in_progress" | "completed";
export type MoodValue = "happy" | "calm" | "tired" | "anxious" | "low";

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo extends BaseRecord {
  title: string;
  date: LocalDate;
  isImportant: boolean;
  notes?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Memo extends BaseRecord {
  content: string;
  pinned: boolean;
}

export interface FitnessEntry extends BaseRecord {
  activity: string;
  durationMinutes: number;
  calories?: number;
  date: LocalDate;
  performedAt: string;
  feeling?: string;
}

export interface DietEntry extends BaseRecord {
  date: LocalDate;
  meal: MealType;
  food: string;
  portion?: string;
  price?: number;
  recordedAt?: string;
  notes?: string;
}

export interface EntertainmentItem extends BaseRecord {
  title: string;
  category: EntertainmentCategory;
  status: EntertainmentStatus;
  date: LocalDate;
  totalMinutes: number;
  rating?: number;
  notes?: string;
}

export interface StudyEntry extends BaseRecord {
  date: LocalDate;
  subject: string;
  content: string;
  durationMinutes: number;
  progress: StudyProgress;
  goalOrNotes?: string;
  studiedAt: string;
}

export interface MoodEntry extends BaseRecord {
  date: LocalDate;
  mood: MoodValue;
  tags: string[];
  note?: string;
  recordedAt: string;
}

export type PageColors = Record<PageKey, string>;

export interface AppSettings extends BaseRecord {
  id: "app";
  theme: ThemeMode;
  todoSort: TodoSort;
  pageColors: PageColors;
  lastBackupAt?: string;
}

export interface AppData {
  todos: Todo[];
  memos: Memo[];
  fitnessEntries: FitnessEntry[];
  dietEntries: DietEntry[];
  entertainmentItems: EntertainmentItem[];
  studyEntries: StudyEntry[];
  moodEntries: MoodEntry[];
  settings: AppSettings;
}

export interface HomeSummary {
  todos: {
    total: number;
    completed: number;
    incomplete: number;
    topIncomplete: Todo[];
  };
  fitness: {
    count: number;
    totalMinutes: number;
    latest: FitnessEntry | null;
  };
  diet: {
    recordedMeals: MealType[];
    latest: DietEntry | null;
  };
  entertainment: {
    activeCount: number;
    latestActive: EntertainmentItem | null;
  };
  study: {
    count: number;
    totalMinutes: number;
  };
  mood: {
    latest: MoodEntry | null;
  };
}
