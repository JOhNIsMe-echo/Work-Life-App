import { render, screen } from "@testing-library/react";
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

describe("entertainment, study, and mood", () => {
  it("records an entertainment project and shows it on the homepage", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "游戏娱乐" }));
    await user.click(await screen.findByRole("button", { name: "添加项目" }));
    await user.type(screen.getByLabelText("项目名称"), "星露谷物语");
    await user.selectOptions(screen.getByLabelText("当前状态"), "playing");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("星露谷物语")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "首页总览" }));
    expect(await screen.findByText("星露谷物语")).toBeInTheDocument();
    expect(screen.getByText("1 项正在进行")).toBeInTheDocument();
  });

  it("records study minutes and updates the homepage total", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "学业记录" }));
    await user.click(await screen.findByRole("button", { name: "记录学习" }));
    await user.type(screen.getByLabelText("学科或学习方向"), "阅读");
    await user.type(screen.getByLabelText("这次学了什么"), "《设计心理学》第三章");
    await user.type(screen.getByLabelText("学习时长（分钟）"), "45");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("《设计心理学》第三章")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "首页总览" }));
    expect(await screen.findByText("学习 45 分钟")).toBeInTheDocument();
  });

  it("allows multiple daily moods and shows the most recent on the homepage", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "心情记录" }));
    await user.click(await screen.findByRole("button", { name: "记录此刻" }));
    await user.type(screen.getByLabelText("想记下点什么"), "上午很平静");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect((await screen.findAllByText("上午很平静")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "记录此刻" }));
    await user.click(screen.getByRole("radio", { name: "开心" }));
    await user.type(screen.getByLabelText("想记下点什么"), "事情有了进展");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect((await screen.findAllByText("事情有了进展")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("link", { name: "首页总览" }));
    expect(await screen.findByText("开心")).toBeInTheDocument();
  });
});
