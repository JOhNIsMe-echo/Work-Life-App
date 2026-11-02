import { chromium, expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PAGES = [
  { link: "首页总览", heading: "今天，按自己的节奏来" },
  { link: "今日待办", heading: "今日待办" },
  { link: "健身记录", heading: "健身记录" },
  { link: "饮食记录", heading: "饮食记录" },
  { link: "游戏娱乐", heading: "游戏娱乐" },
  { link: "学业记录", heading: "学业记录" },
  { link: "心情记录", heading: "心情记录" },
  { link: "数据与设置", heading: "数据与设置" },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders eight navigable pages without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await expect(page).toHaveTitle("我的生活");
  for (const item of PAGES) {
    await page.getByRole("link", { name: item.link }).click();
    await expect(
      page.getByRole("heading", { name: item.heading, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: item.link })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }

  await expect(page.locator(".vite-error-overlay")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("renders the refined minimalist shell consistently", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();

  await expect(page.locator("aside")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主要页面" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "今天，按自己的节奏来" })).toHaveCSS(
    "font-size",
    "36px",
  );
  await expect(page.getByRole("link", { name: "首页总览" })).toHaveCSS(
    "min-height",
    "42px",
  );

  const layout = await page.evaluate(() => ({
    shellRadius: getComputedStyle(document.querySelector('[class*="appWindow"]')!)
      .borderRadius,
    pageOverflow:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(layout.shellRadius).toBe("24px");
  expect(layout.pageOverflow).toBeLessThanOrEqual(1);
});

test("creates all core record types and restores them after a new page opens", async ({
  page,
  context,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== "127.0.0.1" &&
      url.hostname !== "localhost"
    ) {
      externalRequests.push(request.url());
    }
  });

  await page.getByRole("link", { name: "今日待办" }).click();
  await page.getByRole("button", { name: "新建待办" }).click();
  await page.getByLabel("要做的事").fill("整理周报资料");
  await page.getByLabel("补充说明").fill("今天下班前完成");
  await page.getByRole("checkbox", { name: "标记为重要事项" }).check();
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("整理周报资料")).toBeVisible();

  await page.getByRole("link", { name: "首页总览" }).click();
  await page.getByRole("button", { name: "新增备忘" }).click();
  await page.getByLabel("备忘内容").fill("周末试做番茄牛腩");
  await page.getByRole("checkbox", { name: "固定到首页顶部" }).check();
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("周末试做番茄牛腩")).toBeVisible();

  await page.getByRole("link", { name: "健身记录" }).click();
  await page.getByRole("button", { name: "记录运动" }).click();
  await page.getByLabel("运动项目").fill("户外跑步");
  await page.getByLabel("运动时长（分钟）").fill("35");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("户外跑步")).toBeVisible();

  await page.getByRole("link", { name: "饮食记录" }).click();
  await page.getByRole("button", { name: "添加食物" }).click();
  await page.getByLabel("吃了什么").fill("鸡胸肉沙拉");
  await page.getByLabel("大致份量").fill("1 份");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("鸡胸肉沙拉")).toBeVisible();

  await page.getByRole("link", { name: "游戏娱乐" }).click();
  await page.getByRole("button", { name: "添加项目" }).click();
  await page.getByLabel("项目名称").fill("星露谷物语");
  await page.getByLabel("当前状态").selectOption("playing");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("星露谷物语")).toBeVisible();

  await page.getByRole("link", { name: "学业记录" }).click();
  await page.getByRole("button", { name: "记录学习" }).click();
  await page.getByLabel("学科或学习方向").fill("阅读");
  await page.getByLabel("这次学了什么").fill("《设计心理学》第 3 章");
  await page.getByLabel("学习时长（分钟）").fill("45");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("《设计心理学》第 3 章")).toBeVisible();

  await page.getByRole("link", { name: "心情记录" }).click();
  await page.getByRole("button", { name: "记录此刻" }).click();
  await page.getByRole("radio", { name: "平静" }).check();
  await page.getByLabel("心情标签").fill("期待、有点累");
  await page.getByLabel("想记下点什么").fill("事情在慢慢推进");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("事情在慢慢推进").first()).toBeVisible();

  await page.getByRole("link", { name: "首页总览" }).click();
  await expect(page.getByText("已记录 1 / 4 餐")).toBeVisible();
  await expect(page.getByText("学习 45 分钟")).toBeVisible();
  await expect(page.getByText("1 项正在进行")).toBeVisible();
  await expect(page.getByText("整理周报资料")).toBeVisible();
  await expect(page.getByText("周末试做番茄牛腩")).toBeVisible();

  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.getByText("整理周报资料")).toBeVisible();
  await expect(reopened.getByText("周末试做番茄牛腩")).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test("previews, exports, clears, and restores a real backup file", async ({ page }) => {
  await page.getByRole("link", { name: "今日待办" }).click();
  await page.getByRole("button", { name: "新建待办" }).click();
  await page.getByLabel("要做的事").fill("需要进入备份的待办");
  await page.getByRole("button", { name: "保存" }).click();

  await page.getByRole("link", { name: "数据与设置" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();

  await page.getByRole("button", { name: "清空数据" }).click();
  await page.getByLabel("请输入“清空”确认").fill("清空");
  await page.getByRole("button", { name: "确认清空" }).click();
  await page.getByRole("link", { name: "今日待办" }).click();
  await expect(page.getByText("今天还没有待办")).toBeVisible();

  await page.getByRole("link", { name: "数据与设置" }).click();
  await page.getByLabel("选择备份文件").setInputFiles(path!);
  await expect(
    page.getByRole("alertdialog", { name: "恢复这个备份吗？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "确认恢复" }).click();
  await page.getByRole("link", { name: "今日待办" }).click();
  await expect(page.getByText("需要进入备份的待办")).toBeVisible();
});

test("persists page colors and supports keyboard drawer controls", async ({ page }) => {
  await page.getByRole("link", { name: "数据与设置" }).click();
  await page.getByRole("button", { name: "深色" }).click();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();

  const colorInput = page.getByLabel("首页总览颜色");
  await colorInput.evaluate((element) => {
    const input = element as HTMLInputElement;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setValue?.call(input, "#123456");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect
    .poll(() =>
      page
        .getByRole("link", { name: "首页总览" })
        .evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--nav-accent"),
        ),
    )
    .toBe("#123456");

  await page.reload();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await page.getByRole("link", { name: "首页总览" }).click();
  await expect
    .poll(() =>
      page
        .locator("[data-theme]")
        .evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--app-accent"),
        ),
    )
    .toBe("#123456");

  await page.getByRole("link", { name: "今日待办" }).click();
  await page.getByRole("button", { name: "新建待办" }).click();
  await expect(page.getByLabel("要做的事")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("fits desktop and narrow viewports without horizontal overflow", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 900 },
    { width: 390, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const sizes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  }
});

test("persists records after the browser process is closed and reopened", async () => {
  const profile = await mkdtemp(join(tmpdir(), "worklife-profile-"));
  const launchOptions = { channel: "msedge" as const, headless: true };

  try {
    let context = await chromium.launchPersistentContext(profile, launchOptions);
    let page = context.pages()[0] ?? (await context.newPage());
    await page.goto("http://127.0.0.1:4173/#/todos");
    await page.getByRole("button", { name: "新建待办" }).click();
    await page.getByLabel("要做的事").fill("浏览器重启后仍需保留");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("浏览器重启后仍需保留")).toBeVisible();
    await context.close();

    context = await chromium.launchPersistentContext(profile, launchOptions);
    page = context.pages()[0] ?? (await context.newPage());
    await page.goto("http://127.0.0.1:4173/#/todos");
    await expect(page.getByText("浏览器重启后仍需保留")).toBeVisible();
    await context.close();
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
});
