import { render, screen, within } from "@testing-library/react";
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

describe("fitness and diet records", () => {
  it("creates a fitness entry and updates the homepage summary", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "健身记录" }));
    await user.click(await screen.findByRole("button", { name: "记录运动" }));
    await user.type(screen.getByLabelText("运动项目"), "户外跑步");
    await user.type(screen.getByLabelText("运动时长（分钟）"), "35");
    await user.click(screen.getByRole("button", { name: "保存" }));

    const activity = await screen.findByText("户外跑步");
    expect(activity).toBeInTheDocument();
    expect(within(activity.closest("article")!).getByText("35")).toBeVisible();

    await user.click(screen.getByRole("link", { name: "首页总览" }));
    expect((await screen.findAllByText("35 分钟")).length).toBeGreaterThan(0);
    expect(screen.getByText(/最近 户外跑步/)).toBeInTheDocument();
  });

  it("groups food by meal and updates the homepage meal count", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "饮食记录" }));
    await user.click(await screen.findByRole("button", { name: "添加食物" }));
    await user.type(screen.getByLabelText("吃了什么"), "鸡胸肉沙拉");
    await user.type(screen.getByLabelText("大致份量"), "1 份");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("鸡胸肉沙拉")).toBeInTheDocument();
    expect(screen.getByText("午餐")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "首页总览" }));
    expect(await screen.findByText("已记录 1 / 4 餐")).toBeInTheDocument();
    expect(screen.getByText("最近：鸡胸肉沙拉")).toBeInTheDocument();
  });
});
