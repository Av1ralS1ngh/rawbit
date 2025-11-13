import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpcodeExpandedView, SelectedCategory } from "@/components/nodes/opcode/OpcodeExpandedView";

const fullSearch = "hash";
const filteredOps = [
  { name: "OP_HASH160", description: "hash", hex: "a9" },
  { name: "OP_EQUAL", description: "check", hex: "87" },
];

const selectedOps = [{ name: "OP_DUP", description: "dup", hex: "76" }];

const renderView = (category: SelectedCategory = "all") =>
  render(
    <OpcodeExpandedView
      fullSearch={fullSearch}
      onFullSearchChange={vi.fn()}
      category={category}
      onCategoryChange={vi.fn()}
      filteredOps={filteredOps}
      onAddOp={vi.fn()}
      selectedOps={selectedOps}
      onRemoveOp={vi.fn()}
      categoryScrollRef={{ current: null }}
      opcodeScrollRef={{ current: null }}
      sequenceScrollRef={{ current: null }}
    />
  );

describe("OpcodeExpandedView", () => {
  it("renders categories and search input", () => {
    renderView();
    expect(screen.getByPlaceholderText(/search all opcodes/i)).toHaveValue(fullSearch);
    expect(screen.getByText(/Filter by Category/)).toBeInTheDocument();
  });

  it("marks selected category", () => {
    renderView("crypto" as SelectedCategory);
    const buttons = screen.getAllByRole("button", { name: /crypto|all/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("lists filtered opcodes and selected sequence", () => {
    renderView();
    expect(screen.getByText(/OP_HASH160/)).toBeInTheDocument();
    expect(screen.queryByText(/Sequence empty/)).toBeNull();
  });
});
