export type SaveSnapshot = {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: string | null;
  message?: string;
};

const initialSnapshot: SaveSnapshot = {
  status: "idle",
  lastSavedAt: null,
};

export class SaveStatusStore {
  private snapshot: SaveSnapshot = initialSnapshot;
  private listeners = new Set<() => void>();

  getSnapshot = (): SaveSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(next: SaveSnapshot): void {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  markLoaded(): void {
    if (this.snapshot.status !== "idle") {
      return;
    }
    this.update({
      status: "saved",
      lastSavedAt: new Date().toISOString(),
    });
  }

  markError(error: unknown): void {
    this.update({
      status: "error",
      lastSavedAt: this.snapshot.lastSavedAt,
      message: error instanceof Error ? error.message : "无法读取本地数据，请重试。",
    });
  }

  async run<T>(operation: () => Promise<T>): Promise<T> {
    this.update({ status: "saving", lastSavedAt: this.snapshot.lastSavedAt });

    try {
      const result = await operation();
      this.update({
        status: "saved",
        lastSavedAt: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      this.update({
        status: "error",
        lastSavedAt: this.snapshot.lastSavedAt,
        message: error instanceof Error ? error.message : "无法写入本地数据，请重试。",
      });
      throw error;
    }
  }
}

export const saveStatusStore = new SaveStatusStore();
