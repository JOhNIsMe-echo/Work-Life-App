import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { db } from "../../src/data/db";
import { repositories } from "../../src/data/repositories";

beforeEach(async () => {
  window.location.hash = "#/todos";
  await Promise.all(db.tables.map((table) => table.clear()));
  await repositories.settings.get();
  await repositories.todos.create({
    title: "B 普通待办",
    date: "2026-11-02",
    isImportant: false,
    completed: false,
  });
  await new Promise((resolve) => window.setTimeout(resolve, 2));
  await repositories.todos.create({
    title: "A 重要待办",
    date: "2026-11-02",
    isImportant: true,
    completed: false,
  });
});

afterEach(() => {
  window.location.hash = "";
});

describe("todo sorting", () => {
  it("changes visible order and persists the selected sort after remount", async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    const sort = await screen.findByLabelText("待办排序");
    await user.selectOptions(sort, "title");
    expect(
      [...document.querySelectorAll<HTMLElement>('[class*="taskMain"] > strong')]
        .map((node) => node.textContent)
        .slice(0, 2),
    ).toEqual(["A 重要待办", "B 普通待办"]);

    await waitFor(async () =>
      expect((await repositories.settings.get()).todoSort).toBe("title"),
    );
    first.unmount();
    render(<App />);
    await waitFor(() => expect(screen.getByLabelText("待办排序")).toHaveValue("title"));
  });
});
