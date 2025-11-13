import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLimitErrorRecovery } from "@/hooks/useLimitErrorRecovery";
import type { FlowNode } from "@/types";

const makeNode = (overrides?: Partial<FlowNode>): FlowNode => ({
  id: "node-a",
  type: "calculation",
  position: { x: 0, y: 0 },
  data: {
    dirty: false,
    error: true,
    extendedError: "LIMIT",
    scriptDebugSteps: { scriptSig: "00" },
  },
  ...overrides,
});

describe("useLimitErrorRecovery", () => {
  it("mutates calculable nodes when limit errors are present", () => {
    const nodes = [
      makeNode(),
      makeNode({ id: "node-b", type: "shadcnTextInfo", data: { dirty: false } }),
    ];
    const setNodes = vi.fn((updater) => {
      const next = (updater as (prev: FlowNode[]) => FlowNode[])(nodes);
      expect(next[0].data?.dirty).toBe(true);
      expect(next[0].data?.error).toBe(false);
      expect(next[0].data?.extendedError).toBeUndefined();
      expect(next[0].data?.scriptDebugSteps).toBeUndefined();
      expect(next[1]).toBe(nodes[1]);
      return next;
    });

    const { result } = renderHook(() =>
      useLimitErrorRecovery(true, setNodes)
    );

    act(() => {
      result.current();
    });

    expect(setNodes).toHaveBeenCalled();
  });

  it("is a no-op when limit errors are absent", () => {
    const setNodes = vi.fn();
    const { result } = renderHook(() =>
      useLimitErrorRecovery(false, setNodes)
    );

    act(() => {
      result.current();
    });

    expect(setNodes).not.toHaveBeenCalled();
  });
});
