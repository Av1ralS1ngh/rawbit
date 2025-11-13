import type { Edge, NodeProps } from "@xyflow/react";
import type {
  FlowNode,
  FlowData,
  SharePayload,
  ScriptExecutionResult,
  StepData,
} from "@/types";

export type FlowNodeInput = Partial<FlowNode> & {
  id?: string;
  type?: FlowNode["type"];
};

let idCounter = 0;

const nextId = () => `node_test_${++idCounter}`;

export function buildFlowNode(overrides: FlowNodeInput = {}): FlowNode {
  const {
    id = nextId(),
    type = "calculation",
    position = { x: 0, y: 0 },
    data = {},
    selected = false,
    ...rest
  } = overrides;

  return {
    id,
    type,
    position,
    data,
    selected,
    ...rest,
  } satisfies FlowNode;
}

export function buildNodeProps(
  node: FlowNode,
  overrides: Partial<NodeProps<FlowNode>> = {}
): NodeProps<FlowNode> {
  return {
    id: node.id,
    data: node.data,
    width: node.width,
    height: node.height,
    sourcePosition: node.sourcePosition,
    targetPosition: node.targetPosition,
    selected: !!node.selected,
    dragHandle: node.dragHandle,
    selectable: node.selectable,
    deletable: node.deletable,
    draggable: node.draggable,
    parentId: node.parentId,
    type: node.type ?? "calculation",
    dragging: node.dragging ?? false,
    zIndex: node.zIndex ?? 0,
    isConnectable: node.connectable ?? true,
    positionAbsoluteX: node.positionAbsolute?.x ?? node.position.x,
    positionAbsoluteY: node.positionAbsolute?.y ?? node.position.y,
    ...overrides,
  };
}

export function buildEdge(
  overrides: Partial<Edge> & { source: string; target: string }
): Edge {
  const { id = `edge_test_${++idCounter}`, sourceHandle, targetHandle, ...rest } = overrides;
  return {
    id,
    sourceHandle: sourceHandle ?? null,
    targetHandle: targetHandle ?? null,
    ...rest,
  } satisfies Edge;
}

export function buildFlowData(
  overrides: Partial<FlowData> = {}
): FlowData {
  return {
    nodes: [],
    edges: [],
    schemaVersion: 1,
    name: "test-flow",
    ...overrides,
  } satisfies FlowData;
}

export function buildScriptExecutionResult(
  overrides: Partial<ScriptExecutionResult> = {}
): ScriptExecutionResult {
  return {
    isValid: true,
    steps: [],
    ...overrides,
  } satisfies ScriptExecutionResult;
}

export function buildStepData(overrides: Partial<StepData> = {}): StepData {
  return {
    pc: 0,
    opcode: 0,
    opcode_name: "NOP",
    stack_before: [],
    stack_after: [],
    ...overrides,
  } satisfies StepData;
}

export function buildSharePayload(
  overrides: Partial<SharePayload> = {}
): SharePayload {
  return {
    name: "test-share",
    schemaVersion: 1,
    nodes: [],
    edges: [],
    ...overrides,
  } satisfies SharePayload;
}
