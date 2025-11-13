import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCopyPaste } from "../useCopyPaste";
import {
  getScriptSteps,
  restoreScriptSteps,
  setScriptSteps,
} from "@/lib/share/scriptStepsCache";
import type { Edge } from "@xyflow/react";
import type { FlowNode, ScriptExecutionResult, StepData } from "@/types";
import { buildFlowNode } from "@/test-utils/types";

const state: {
  nodes: FlowNode[];
  edges: Edge[];
} = {
  nodes: [],
  edges: [],
};

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    getNodes: () => state.nodes,
    getEdges: () => state.edges,
    setNodes: (updater: FlowNode[] | ((prev: FlowNode[]) => FlowNode[])) => {
      state.nodes =
        typeof updater === "function" ? updater(state.nodes) : updater;
    },
    setEdges: (updater: Edge[] | ((prev: Edge[]) => Edge[])) => {
      state.edges =
        typeof updater === "function" ? updater(state.edges) : updater;
    },
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
  }),
}));

describe("useCopyPaste", () => {
  beforeEach(() => {
    restoreScriptSteps([]);
    state.nodes = [];
    state.edges = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves script verification steps across multiple pastes", () => {
    const originalSteps: ScriptExecutionResult = {
      isValid: true,
      steps: [
        {
          pc: 0,
          opcode: 118,
          opcode_name: "OP_DUP",
          stack_before: [],
          stack_after: ["01"],
        } satisfies StepData,
      ],
    };

    const baseNode = buildFlowNode({
      id: "node_original",
      type: "calculation",
      position: { x: 0, y: 0 },
      data: { functionName: "script_verification" },
      selected: true,
    });

    state.nodes = [baseNode];
    setScriptSteps(baseNode.id, originalSteps);

    const { result } = renderHook(() => useCopyPaste());

    act(() => {
      result.current.copyNodes();
    });

    act(() => {
      result.current.pasteNodes();
    });

    const firstPaste = state.nodes.find((n) => n.id !== baseNode.id);
    expect(firstPaste).toBeTruthy();
    if (!firstPaste) throw new Error("First pasted node not found");
    expect(getScriptSteps(firstPaste.id)).toEqual(originalSteps);

    act(() => {
      result.current.pasteNodes();
    });

    const pastedIds = new Set([baseNode.id, firstPaste.id]);
    const secondPaste = state.nodes.find((n) => !pastedIds.has(n.id));
    expect(secondPaste).toBeTruthy();
    if (!secondPaste) throw new Error("Second pasted node not found");
    expect(getScriptSteps(secondPaste.id)).toEqual(originalSteps);
  });
});
