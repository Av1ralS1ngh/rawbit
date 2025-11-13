import React from "react";
import { renderHook, act } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import type { Edge, ReactFlowInstance } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FlowNode } from "@/types";
import { buildFlowData, buildFlowNode } from "@/test-utils/types";
import { useNodeOperations } from "../useNodeOperations";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("useNodeOperations", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

const createMockInstance = (
  result: { current: ReturnType<typeof useNodeOperations> }
): ReactFlowInstance<FlowNode, Edge> => {
  const instance: Partial<ReactFlowInstance<FlowNode, Edge>> & {
    updateNodeInternals?: (id: string) => void;
  } = {
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    getNodes: () => result.current.nodes,
    getEdges: () => result.current.edges,
    getNodesBounds: (
      nodesParam: Parameters<ReactFlowInstance<FlowNode, Edge>["getNodesBounds"]>[0]
    ) => {
      const concreteNodes = nodesParam as FlowNode[];
      const xs = concreteNodes.map((n) => n.position.x);
      const ys = concreteNodes.map((n) => n.position.y);
      if (!xs.length) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs) + 1,
        height: Math.max(...ys) - Math.min(...ys) + 1,
      };
    },
    getIntersectingNodes: () => [] as FlowNode[],
    updateNodeInternals: vi.fn(),
  };

  return instance as ReactFlowInstance<FlowNode, Edge>;
};

  it("drops flow templates onto the canvas", () => {
    const { result } = renderHook(() => useNodeOperations(), { wrapper });
    const mockRf = createMockInstance(result);

    act(() => {
      result.current.onInit(mockRf);
    });

    const flowData = buildFlowData({
      nodes: [
        buildFlowNode({
          id: "template-node",
          type: "calculation",
          position: { x: 10, y: 20 },
          data: { functionName: "identity" },
        }),
      ],
      edges: [],
    });

    const event = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: (type: string) =>
          type === "application/reactflow"
            ? JSON.stringify({
                functionName: "flow_template",
                nodeData: { flowData },
              })
            : "",
      },
      clientX: 50,
      clientY: 60,
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      result.current.onDrop(event);
    });

    expect(result.current.nodes.some((n) => n.id === "template-node")).toBe(true);
  });

  it("groups selected nodes into a new group", () => {
    const { result } = renderHook(() => useNodeOperations(), { wrapper });
    const mockRf = createMockInstance(result);

    act(() => {
      result.current.onInit(mockRf);
    });

    act(() => {
      result.current.setNodes(() => [
        buildFlowNode({
          id: "a",
          type: "calculation",
          position: { x: 0, y: 0 },
          data: { functionName: "identity" },
          selected: true,
        }),
        buildFlowNode({
          id: "b",
          type: "calculation",
          position: { x: 100, y: 0 },
          data: { functionName: "identity" },
          selected: true,
        }),
      ]);
    });

    act(() => {
      // ensure getNodes sees latest state
      mockRf.getNodes = () => result.current.nodes;
      mockRf.getNodesBounds = () => ({
        x: 0,
        y: 0,
        width: 100,
        height: 40,
      });
      result.current.groupSelectedNodes();
    });

    const group = result.current.nodes.find((n) => n.type === "shadcnGroup");
    expect(group).toBeDefined();
    expect(result.current.nodes.filter((n) => n.parentId === group?.id)).toHaveLength(2);
  });
});
