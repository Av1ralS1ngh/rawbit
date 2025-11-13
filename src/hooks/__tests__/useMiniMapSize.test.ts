import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMiniMapSize } from "../useMiniMapSize";
import type { FlowNode } from "@/types";

const node = (id: string, x: number, y: number, width = 200, height = 100): FlowNode => ({
  id,
  type: "calculation",
  position: { x, y },
  data: { functionName: "identity" },
  measured: { width, height },
} as unknown as FlowNode);

describe("useMiniMapSize", () => {
  it("returns the default size when minimap is hidden", () => {
    const { result } = renderHook(() => useMiniMapSize([], false, { longSide: 200, defaultHeight: 120 }));
    expect(result.current).toEqual({ w: 200, h: 120 });
  });

  it("scales height when the graph is wide", async () => {
    const nodes = [node("a", 0, 0, 400, 100), node("b", 600, 0, 300, 120)];
    const { result, rerender } = renderHook(({ data }) => useMiniMapSize(data, true, { longSide: 200, shortSideMin: 80, defaultHeight: 120 }), {
      initialProps: { data: [] as FlowNode[] },
    });

    rerender({ data: nodes });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.w).toBe(200);
    expect(result.current.h).toBeGreaterThanOrEqual(80);
    expect(result.current.h).toBeLessThanOrEqual(200);
  });

  it("scales width when the graph is tall", async () => {
    const nodes = [node("a", 0, 0, 100, 500), node("b", 0, 600, 120, 400)];
    const { result, rerender } = renderHook(({ data }) => useMiniMapSize(data, true, { longSide: 200, shortSideMin: 80, defaultHeight: 120 }), {
      initialProps: { data: [] as FlowNode[] },
    });

    rerender({ data: nodes });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.h).toBe(200);
    expect(result.current.w).toBeGreaterThanOrEqual(80);
    expect(result.current.w).toBeLessThanOrEqual(200);
  });
});
