import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { UndoRedoPanel } from "../UndoRedoPanel";

const jumpTo = vi.fn();

vi.mock("@/hooks/useUndoRedo", () => ({
  useUndoRedo: () => ({
    history: [{ label: "Initial Load" }, { label: "Edit Node" }],
    pointer: 0,
    jumpTo,
  }),
}));

describe("UndoRedoPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders history entries and supports jumping", () => {
    render(<UndoRedoPanel isOpen hasVisibleTabs onClose={vi.fn()} />);

    expect(screen.getByText("Undo/Redo Stack")).toBeInTheDocument();
    const historyButton = screen.getByText("1. Edit Node");
    fireEvent.click(historyButton);
    expect(jumpTo).toHaveBeenCalledWith(1);
  });

  it("invokes onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<UndoRedoPanel isOpen hasVisibleTabs onClose={onClose} />);

    fireEvent.click(screen.getByTitle("Close panel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("applies tab-aware height when tabs are visible", () => {
    const { rerender } = render(<UndoRedoPanel isOpen hasVisibleTabs onClose={vi.fn()} />);
    const list = screen.getByRole("list").parentElement as HTMLElement;
    expect(list.style.maxHeight).toContain("3.5rem - 2.5rem - 2.5rem");

    rerender(<UndoRedoPanel isOpen hasVisibleTabs={false} onClose={vi.fn()} />);
    const updatedList = screen.getByRole("list").parentElement as HTMLElement;
    expect(updatedList.style.maxHeight).toContain("3.5rem - 2.5rem");
    expect(updatedList.style.maxHeight).not.toContain("- 2.5rem - 2.5rem");
  });

  it("prevents text selection within the panel surface", () => {
    render(<UndoRedoPanel isOpen hasVisibleTabs onClose={vi.fn()} />);
    expect(screen.getByTestId("undo-redo-panel").className).toContain("select-none");
  });
});
