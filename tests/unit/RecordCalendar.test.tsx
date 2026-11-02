import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecordCalendar } from "../../src/components/RecordCalendar/RecordCalendar";

describe("RecordCalendar", () => {
  it("shows record markers and selects a day", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <RecordCalendar
        ariaLabel="饮食记录日历"
        month={new Date(2026, 10, 1)}
        selectedDate="2026-11-02"
        maxDate="2026-11-02"
        markers={{
          "2026-11-02": {
            count: 2,
            value: 35,
            detail: "2 项 · ¥35.00",
          },
        }}
        onMonthChange={() => undefined}
        onSelectDate={onSelectDate}
      />,
    );

    expect(screen.getByRole("region", { name: "饮食记录日历" })).toBeInTheDocument();
    const markedDay = screen.getByRole("button", {
      name: "11月2日，2 项 · ¥35.00",
    });
    expect(markedDay).toHaveAttribute("aria-pressed", "true");
    expect(markedDay).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: "11月1日，没有记录" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-01");
  });

  it("moves between months and disables navigation beyond the maximum month", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    const { rerender } = render(
      <RecordCalendar
        ariaLabel="健身记录日历"
        month={new Date(2026, 9, 1)}
        selectedDate="2026-10-15"
        maxDate="2026-11-02"
        markers={{}}
        onMonthChange={onMonthChange}
        onSelectDate={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "上一个月" }));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 8, 1));

    rerender(
      <RecordCalendar
        ariaLabel="健身记录日历"
        month={new Date(2026, 10, 1)}
        selectedDate="2026-11-02"
        maxDate="2026-11-02"
        markers={{}}
        onMonthChange={onMonthChange}
        onSelectDate={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "下一个月" })).toBeDisabled();
  });
});
