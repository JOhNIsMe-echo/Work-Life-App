import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { db } from "../../src/data/db";
import { repositories } from "../../src/data/repositories";
import { createBackup, readAllData, replaceAllData } from "../../src/lib/backup";

beforeEach(async () => {
  window.location.hash = "";
  await Promise.all(db.tables.map((table) => table.clear()));
});

afterEach(() => {
  window.location.hash = "";
});

describe("settings", () => {
  it("persists theme and the independent page color", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await user.click(screen.getByRole("link", { name: "数据与设置" }));
    await user.click(await screen.findByRole("button", { name: "深色" }));
    await waitFor(() =>
      expect(view.container.querySelector('[data-theme="dark"]')).toBeInTheDocument(),
    );

    const homeColor = screen.getByLabelText("首页总览颜色");
    fireEvent.change(homeColor, { target: { value: "#123456" } });
    await waitFor(() => {
      const homeLink = screen.getByRole("link", { name: "首页总览" });
      expect(homeLink.style.getPropertyValue("--nav-accent")).toBe("#123456");
    });

    await user.click(screen.getByRole("link", { name: "首页总览" }));
    await waitFor(() => {
      const themeRoot = view.container.querySelector<HTMLElement>("[data-theme]");
      expect(themeRoot?.style.getPropertyValue("--app-accent")).toBe("#123456");
    });
    await user.click(screen.getByRole("link", { name: "数据与设置" }));
    expect(await screen.findByLabelText("首页总览颜色")).toHaveValue("#123456");
  });

  it("clears records only after typing the confirmation phrase", async () => {
    const user = userEvent.setup();
    await repositories.todos.create({
      title: "清空前待办",
      date: "2026-11-01",
      isImportant: false,
      completed: false,
    });
    render(<App />);

    await user.click(screen.getByRole("link", { name: "数据与设置" }));
    await user.click(await screen.findByRole("button", { name: "清空数据" }));
    const confirm = screen.getByRole("button", { name: "确认清空" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("请输入“清空”确认"), "清空");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(
      await screen.findByText("个人记录已清空，外观设置已保留"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "今日待办" }));
    expect(await screen.findByText("今天还没有待办")).toBeInTheDocument();
  });

  it("previews a backup before replacing current data", async () => {
    const user = userEvent.setup();
    await repositories.settings.get();
    const base = await readAllData(db);
    const backup = createBackup({
      ...base,
      todos: [
        {
          id: "restored-todo",
          title: "从备份恢复的待办",
          date: "2026-11-01",
          isImportant: false,
          completed: false,
          createdAt: "2026-11-01T08:00:00.000Z",
          updatedAt: "2026-11-01T08:00:00.000Z",
        },
      ],
    });
    await replaceAllData(db, {
      ...base,
      todos: [
        {
          id: "current-todo",
          title: "当前待办",
          date: "2026-11-01",
          isImportant: false,
          completed: false,
          createdAt: "2026-11-01T09:00:00.000Z",
          updatedAt: "2026-11-01T09:00:00.000Z",
        },
      ],
    });
    render(<App />);

    await user.click(screen.getByRole("link", { name: "数据与设置" }));
    const input = await screen.findByLabelText("选择备份文件");
    const file = new File([JSON.stringify(backup)], "worklife-backup.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", {
      value: async () => JSON.stringify(backup),
    });

    await user.upload(input, file);
    expect(
      await screen.findByRole("alertdialog", { name: "恢复这个备份吗？" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect((await readAllData(db)).todos[0]?.title).toBe("当前待办");

    await user.upload(input, file);
    await screen.findByRole("alertdialog", { name: "恢复这个备份吗？" });
    await user.click(screen.getByRole("button", { name: "确认恢复" }));
    await waitFor(async () =>
      expect((await readAllData(db)).todos[0]?.title).toBe("从备份恢复的待办"),
    );
    await user.click(screen.getByRole("link", { name: "今日待办" }));
    expect(await screen.findByText("从备份恢复的待办")).toBeInTheDocument();
  });
});
