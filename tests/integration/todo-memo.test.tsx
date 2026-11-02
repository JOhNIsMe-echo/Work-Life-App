import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { db } from "../../src/data/db";

beforeEach(async () => {
  window.location.hash = "";
  await Promise.all(db.tables.map((table) => table.clear()));
});

afterEach(() => {
  window.location.hash = "";
});

describe("homepage, todos, and memos", () => {
  it("creates a todo, shows it on the homepage, and restores it after refresh", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(screen.getByRole("link", { name: "今日待办" }));
    expect(
      await screen.findByRole("heading", { name: "今日待办" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "新建待办" }));
    await user.type(screen.getByLabelText("要做的事"), "准备项目进度材料");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("准备项目进度材料")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "首页总览" }));
    expect(await screen.findByText("准备项目进度材料")).toBeInTheDocument();

    firstRender.unmount();
    render(<App />);
    expect(await screen.findByText("准备项目进度材料")).toBeInTheDocument();
  });

  it("creates and pins a quick memo, then restores it after deletion", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "新增备忘" }));
    await user.type(
      screen.getByLabelText("备忘内容"),
      "周末试做番茄牛腩，记得买香料。",
    );
    await user.click(screen.getByRole("checkbox", { name: "固定到首页顶部" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(
      await screen.findByText("周末试做番茄牛腩，记得买香料。"),
    ).toBeInTheDocument();
    expect(screen.getByText(/置顶/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /周末试做番茄牛腩，记得买香料。/,
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "删除" }));
    await waitFor(() =>
      expect(
        screen.queryByText("周末试做番茄牛腩，记得买香料。"),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "撤销" }));
    expect(
      await screen.findByText("周末试做番茄牛腩，记得买香料。"),
    ).toBeInTheDocument();
  });
});
