import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EditDrawer } from "../../src/components/EditDrawer/EditDrawer";

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开
      </button>
      <EditDrawer open={open} title="新记录" onClose={() => setOpen(false)}>
        <label>
          内容
          <input aria-label="记录内容" />
        </label>
      </EditDrawer>
    </>
  );
}

describe("EditDrawer", () => {
  it("focuses the first field and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "记录内容" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开" })).toHaveFocus();
  });
});
