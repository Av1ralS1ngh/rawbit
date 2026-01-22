import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CalculationNode from "@/components/nodes/CalculationNode";
import type { FlowNode } from "@/types";
import { buildFlowNode, buildNodeProps } from "@/test-utils/types";

let calcViewMock: ReturnType<typeof vi.fn>;

vi.mock("@/components/nodes/calculation/CalculationNodeView", () => ({
  CalculationNodeView: (props: Record<string, unknown>) => {
    calcViewMock(props);
    return <div data-testid="calc-view" />;
  },
}));

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({ setNodes: vi.fn(), setEdges: vi.fn() }),
  useStore: (selector: (state: { edges: unknown[]; nodes: unknown[] }) => unknown) =>
    selector({ edges: [], nodes: [] }),
}));

vi.mock("@/hooks/useSnapshotSchedulerContext", () => ({
  useSnapshotSchedulerContext: () => ({
    lockEdgeSnapshotSkip: vi.fn(),
    releaseEdgeSnapshotSkip: vi.fn(),
    scheduleSnapshot: vi.fn(),
    lockNodeRemovalSnapshotSkip: vi.fn(),
    releaseNodeRemovalSnapshotSkip: vi.fn(),
    skipNextNodeRemovalRef: { current: false },
  }),
}));

vi.mock("@/hooks/useCalculation", () => ({
  useNodeCalculationLogic: () => ({
    numInputs: 2,
    value: "hello",
    result: "world",
    error: false,
    handleChange: vi.fn(),
  }),
}));

vi.mock("@/hooks/nodes/useCalcNodeDerived", () => ({
  useCalcNodeDerived: () => ({
    isMultiVal: false,
    nodeWidth: 200,
    minHeight: 150,
    connectionStatus: "ok",
    wiredHandles: new Set(["input-1"]),
  }),
}));

vi.mock("@/hooks/nodes/useCalcNodeMutations", () => ({
  useCalcNodeMutations: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/nodes/useClipboardLite", () => ({
  useClipboardLite: () => ({ onCopy: vi.fn() }),
}));

vi.mock("@/hooks/nodes/useGroupInstances", () => ({
  useGroupInstances: () => ({ group: true }),
}));

vi.mock("@/lib/share/scriptStepsCache", () => ({
  getScriptSteps: () => ({ trace: [1] }),
}));

describe("CalculationNode", () => {
  beforeEach(() => {
    calcViewMock = vi.fn();
  });

  it("passes derived props to view", () => {
    const node: FlowNode = buildFlowNode({
      id: "calc-1",
      selected: true,
      data: {
        functionName: "script_verification",
        inputs: { vals: { 0: "sig", 1: "pub" } },
        comment: "note",
        showComment: true,
      },
    });

    render(<CalculationNode {...buildNodeProps(node)} />);

    expect(calcViewMock).toHaveBeenCalled();
    const props = calcViewMock.mock.calls[0][0] as Record<string, unknown>;
    expect(props.script).toMatchObject({
      isScriptVerification: true,
      scriptResult: { trace: [1] },
      scriptSigInputHex: "sig",
      scriptPubKeyInputHex: "pub",
    });
    expect((props.singleValue as { value: string }).value).toBe("hello");
    expect(props.error).toBe(false);
    expect(props.comment).toBe("note");
  });
});
