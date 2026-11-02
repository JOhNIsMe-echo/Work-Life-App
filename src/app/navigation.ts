import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CircleCheckBig,
  Database,
  Dumbbell,
  Gamepad2,
  LayoutDashboard,
  Smile,
  Utensils,
} from "lucide-react";
import type { PageKey } from "../domain/types";

export type PageDefinition = {
  key: PageKey;
  path: string;
  label: string;
  icon: LucideIcon;
};

export const PAGE_DEFINITIONS: PageDefinition[] = [
  { key: "home", path: "/", label: "首页总览", icon: LayoutDashboard },
  { key: "todo", path: "/todos", label: "今日待办", icon: CircleCheckBig },
  { key: "fitness", path: "/fitness", label: "健身记录", icon: Dumbbell },
  { key: "diet", path: "/diet", label: "饮食记录", icon: Utensils },
  { key: "fun", path: "/entertainment", label: "游戏娱乐", icon: Gamepad2 },
  { key: "study", path: "/study", label: "学业记录", icon: BookOpen },
  { key: "mood", path: "/mood", label: "心情记录", icon: Smile },
  { key: "data", path: "/settings", label: "数据与设置", icon: Database },
];

const PATH_TO_PAGE = new Map(PAGE_DEFINITIONS.map((page) => [page.path, page.key]));

export function pageKeyFromPath(pathname: string): PageKey {
  return PATH_TO_PAGE.get(pathname) ?? "home";
}
