import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/app/App";

describe("application bootstrap", () => {
  it("renders the home page and all navigation entries", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "今天，按自己的节奏来" }),
    ).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "主要页面" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(8);
    expect(screen.getByRole("link", { name: "数据与设置" })).toBeInTheDocument();
  });
});
