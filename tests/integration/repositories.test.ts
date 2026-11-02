import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkLifeDatabase } from "../../src/data/db";
import { createRepositories } from "../../src/data/repositories";
import { SaveStatusStore } from "../../src/data/saveStatus";

let database: WorkLifeDatabase;

beforeEach(() => {
  database = new WorkLifeDatabase(`test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await database.delete();
});

describe("repositories", () => {
  it("persists and updates a todo in IndexedDB", async () => {
    const saveStatus = new SaveStatusStore();
    const repositories = createRepositories(database, saveStatus);
    const created = await repositories.todos.create({
      title: "整理周报",
      date: "2026-11-01",
      isImportant: true,
      completed: false,
    });

    expect(await repositories.todos.get(created.id)).toMatchObject({
      title: "整理周报",
      completed: false,
    });

    const completed = await repositories.todos.setCompleted(created.id, true);
    expect(completed.completed).toBe(true);
    expect(completed.completedAt).toBeTruthy();
    expect(saveStatus.getSnapshot().status).toBe("saved");
  });

  it("orders pinned memos before newer unpinned memos", async () => {
    const repositories = createRepositories(database, new SaveStatusStore());
    const pinned = await repositories.memos.create({
      content: "置顶内容",
      pinned: true,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 2));
    await repositories.memos.create({
      content: "较新的内容",
      pinned: false,
    });

    expect((await repositories.memos.ordered())[0]?.id).toBe(pinned.id);
  });

  it("restores a deleted record", async () => {
    const repositories = createRepositories(database, new SaveStatusStore());
    const created = await repositories.mood.create({
      date: "2026-11-01",
      mood: "calm",
      tags: ["平静"],
      recordedAt: "2026-11-01T08:00:00.000Z",
    });
    const deleted = await repositories.mood.remove(created.id);
    expect(deleted).toBeDefined();
    expect(await repositories.mood.get(created.id)).toBeUndefined();

    await repositories.mood.restore(deleted!);
    expect(await repositories.mood.get(created.id)).toBeDefined();
  });

  it("creates and updates the singleton settings record", async () => {
    const repositories = createRepositories(database, new SaveStatusStore());
    const defaults = await repositories.settings.get();
    expect(defaults.theme).toBe("system");
    expect(defaults.pageColors.home).toMatch(/^#/);

    const updated = await repositories.settings.update({ theme: "dark" });
    expect(updated.theme).toBe("dark");
  });
});
