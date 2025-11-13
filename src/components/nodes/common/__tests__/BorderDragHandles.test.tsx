import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BorderDragHandles } from "../BorderDragHandles";

const getNumeric = (value: string) => parseFloat(value.replace("px", ""));

describe("BorderDragHandles", () => {
  it("positions side handles outside the node while leaving corner gaps", () => {
    const { container } = render(
      <BorderDragHandles borderWidth={12} cornerGap={30} />
    );

    const handles = Array.from(
      container.querySelectorAll<HTMLDivElement>("[data-drag-handle]")
    );
    expect(handles).toHaveLength(3);

    const [left, bottom, right] = handles;

    // Left handle spans full height except the corner gap and sits just outside the card.
    expect(left.style.top).toBe("30px");
    expect(left.style.bottom).toBe("30px");
    expect(getNumeric(left.style.left)).toBeCloseTo(-12);
    expect(getNumeric(left.style.width)).toBeCloseTo(24);

    // Bottom handle spans width except for gaps and is offset downward.
    expect(getNumeric(bottom.style.bottom)).toBeCloseTo(-12);
    expect(bottom.style.left).toBe("30px");
    expect(bottom.style.right).toBe("30px");
    expect(getNumeric(bottom.style.height)).toBeCloseTo(24);

    // Right handle mirrors the left.
    expect(right.style.top).toBe("30px");
    expect(right.style.bottom).toBe("30px");
    expect(getNumeric(right.style.right)).toBeCloseTo(-12);
    expect(getNumeric(right.style.width)).toBeCloseTo(24);
  });
});
