import { describe, expect, it } from "vitest";
import { PAGE_DEFINITIONS, pageKeyFromPath } from "../../src/app/navigation";

describe("navigation contract", () => {
  it("keeps the eight confirmed pages in order", () => {
    expect(PAGE_DEFINITIONS.map((page) => page.label)).toEqual([
      "首页总览",
      "今日待办",
      "健身记录",
      "饮食记录",
      "游戏娱乐",
      "学业记录",
      "心情记录",
      "数据与设置",
    ]);
  });

  it("maps route paths back to page keys", () => {
    expect(pageKeyFromPath("/todos")).toBe("todo");
    expect(pageKeyFromPath("/settings")).toBe("data");
    expect(pageKeyFromPath("/unknown")).toBe("home");
  });
});
