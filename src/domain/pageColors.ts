import type { PageColors, PageKey } from "./types";

export const PAGE_LABELS: Record<PageKey, string> = {
  home: "首页总览",
  todo: "今日待办",
  fitness: "健身记录",
  diet: "饮食记录",
  fun: "游戏娱乐",
  study: "学业记录",
  mood: "心情记录",
  data: "数据与设置",
};

export const DEFAULT_PAGE_COLORS: PageColors = {
  home: "#426a54",
  todo: "#765b32",
  fitness: "#3f6b59",
  diet: "#9b6547",
  fun: "#4e6d82",
  study: "#806049",
  mood: "#8c5d69",
  data: "#5d6760",
};

export const PAGE_KEYS = Object.keys(DEFAULT_PAGE_COLORS) as PageKey[];

export function isPageColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function readableTextColor(background: string): string {
  if (!isPageColor(background)) {
    return "#f8fbf8";
  }

  const channels = background
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16)) ?? [66, 106, 84];
  const [red, green, blue] = channels;
  const luminance =
    (0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0)) / 255;

  return luminance > 0.62 ? "#172019" : "#f8fbf8";
}
