import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactFlowInstance, ReactFlowState } from "@xyflow/react";
import * as ReactFlow from "@xyflow/react";
import type { MutableRefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { syncHighlightClasses, updateHighlightSelection, useHighlight } from "../useHighlight";
import type { FlowNode } from "@/types";
import { buildFlowNode } from "@/test-utils/types";

const makeNode = (id: string, overrides: Partial<FlowNode> = {}): FlowNode =>
  buildFlowNode({
    id,
    type: "calculation",
    position: { x: 0, y: 0 },
    data: { functionName: "identity", ...(overrides.data ?? {}) },
    selected: overrides.selected ?? false,
    className: overrides.className,
    dragging: overrides.dragging ?? false,
    zIndex: overrides.zIndex ?? 0,
  });

describe("updateHighlightSelection", () => {
  it("marks only highlighted ids as selected and flagged", () => {
    const nodes = [makeNode("a"), makeNode("b", { selected: true })];
    const result = updateHighlightSelection(nodes, new Set(["b"]));

    expect(result[0]).toBe(nodes[0]);
    expect(result[1]).not.toBe(nodes[1]);
    expect(result[1].selected).toBe(true);
    expect(result[1].data?.isHighlighted).toBe(true);
    expect(result[0].data?.isHighlighted).toBeUndefined();
  });

  it("removes highlight metadata from nodes that are no longer targeted", () => {
    const nodes = [
      makeNode("a", { selected: true, data: { functionName: "identity", isHighlighted: true } }),
    ];

    const result = updateHighlightSelection(nodes, new Set());
    expect(result[0].selected).toBe(false);
    expect(result[0].data?.isHighlighted).toBe(false);
  });
});

describe("syncHighlightClasses", () => {
  it("adds the highlight class and flag for new ids", () => {
    const nodes = [makeNode("a"), makeNode("b", { className: "existing" })];
    const next = new Set(["b"]);
    const changed = new Set(["b"]);

    const result = syncHighlightClasses(nodes, next, changed);
    expect(result[0]).toBe(nodes[0]);
    expect(result[1].className).toMatch(/existing.*is-highlighted|is-highlighted.*existing/);
    expect(result[1].data?.isHighlighted).toBe(true);
  });

  it("removes the highlight class when ids disappear", () => {
    const nodes = [
      makeNode("a", {
        className: "node is-highlighted",
        data: { functionName: "identity", isHighlighted: true },
      }),
    ];

    const result = syncHighlightClasses(nodes, new Set(), new Set(["a"]));
    expect(result[0].className).toBe("node");
    expect(result[0].data?.isHighlighted).toBe(false);
  });
});

type StoreSubset = Pick<ReactFlowState, "edges"> & Partial<ReactFlowState>;

describe("useHighlight hook", () => {
  let nodes: FlowNode[];
  let storeState: StoreSubset;
  let setNodes: ReturnType<typeof vi.fn>;
  let baseSetNodes: ReturnType<typeof vi.fn>;
  let fitView: ReturnType<typeof vi.fn>;
  let hasNodeSelectionRef: MutableRefObject<boolean>;
  let originalRequestAnimationFrame: typeof requestAnimationFrame | undefined;
  let lastStoreResult: unknown;
  let hasStoreResult: boolean;

  const getNodes = () => nodes;
  const getFlowInstance = () => ({
    fitView,
  } as unknown as ReactFlowInstance);

  const renderHighlight = () =>
    renderHook(() =>
      useHighlight({
        setNodes,
        baseSetNodes,
        getNodes,
        getFlowInstance,
        hasNodeSelectionRef,
      })
    );

  beforeEach(() => {
    nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    storeState = { edges: [] };
    hasNodeSelectionRef = { current: false } as MutableRefObject<boolean>;
    fitView = vi.fn();
    setNodes = vi.fn((updater) => {
      nodes = updater(nodes);
      return nodes;
    });
    baseSetNodes = vi.fn((updater) => {
      nodes = updater(nodes);
      return nodes;
    });

    lastStoreResult = undefined;
    hasStoreResult = false;
    vi.spyOn(ReactFlow, "useStore").mockImplementation(
      <T,>(
        selector: (state: ReactFlowState) => T,
        equality?: (a: T, b: T) => boolean
      ) => {
        const next = selector(storeState as ReactFlowState);
        if (hasStoreResult && equality && lastStoreResult !== undefined && equality(lastStoreResult as T, next)) {
          return lastStoreResult as T;
        }
        hasStoreResult = true;
        lastStoreResult = next;
        return next;
      }
    );
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof requestAnimationFrame;
  });

  afterEach(() => {
    if (originalRequestAnimationFrame) {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    } else {
      delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame })
        .requestAnimationFrame;
    }
    vi.restoreAllMocks();
  });

  it("fits highlighted nodes and marks them selected for search", async () => {
    const { result } = renderHighlight();

    await act(async () => {
      result.current[1].highlightAndFit(["a"]);
      await Promise.resolve();
    });

    const fitArgs = fitView.mock.calls.at(-1)?.[0];
    expect(fitArgs?.nodes?.map((n: FlowNode) => n.id)).toEqual(["a"]);
    expect(fitArgs).toMatchObject({ padding: 0.2, duration: 350, maxZoom: 2 });
    expect(nodes.find((n) => n.id === "a")?.selected).toBe(true);
    expect(nodes.find((n) => n.id === "a")?.data?.isHighlighted).toBe(true);

    await waitFor(() => {
      expect(baseSetNodes).toHaveBeenCalled();
    });
    expect(nodes.find((n) => n.id === "a")?.className).toMatch(/is-highlighted/);
    expect(result.current[0].isSearchHighlight).toBe(true);

    act(() => {
      result.current[1].clearHighlights();
    });

    expect(result.current[0].highlightedNodes.size).toBe(0);
    expect(result.current[0].isSearchHighlight).toBe(false);
  });

  it("syncs highlights from selected edges when not searching", async () => {
    const { result, rerender } = renderHighlight();

    storeState.edges = [
      { id: "e-1", source: "a", target: "b", selected: true },
      { id: "e-2", source: "b", target: "c", selected: false },
    ];

    await act(async () => {
      rerender();
    });

    expect([...result.current[0].highlightedNodes]).toEqual(["a", "b"]);

    await waitFor(() => {
      expect(baseSetNodes).toHaveBeenCalled();
    });

    storeState.edges = [];
    await act(async () => {
      rerender();
    });
    expect(result.current[0].highlightedNodes.size).toBe(0);
  });
});
