import type { Edge, EdgeChange, NodeChange } from "@xyflow/react";

import {
  buildEdge,
  buildFlowData,
  buildFlowNode,
  buildScriptExecutionResult,
  buildStepData,
} from "@/test-utils/types";
import type {
  FlowData,
  FlowNode,
  ScriptExecutionResult,
  StepData,
} from "@/types";

export const makeFlowNode = (overrides: Partial<FlowNode> = {}): FlowNode =>
  buildFlowNode({
    type: "calculation",
    position: { x: 0, y: 0 },
    data: { functionName: "identity", dirty: false },
    ...overrides,
  });

export const makeEdge = (
  overrides: Partial<Edge> & { source: string; target: string }
): Edge => buildEdge(overrides);

export const makeFlowData = (
  overrides: Partial<FlowData> = {}
): FlowData =>
  buildFlowData({
    name: "integration-flow",
    schemaVersion: 1,
    nodes: [],
    edges: [],
    ...overrides,
  });

export const makeScriptExecutionResult = (
  overrides: Partial<ScriptExecutionResult> = {}
): ScriptExecutionResult => buildScriptExecutionResult(overrides);

export const makeStepData = (overrides: Partial<StepData> = {}): StepData =>
  buildStepData(overrides);

export const applyNodeChanges = (
  nodes: FlowNode[],
  changes: NodeChange<FlowNode>[]
): FlowNode[] =>
  changes.reduce<FlowNode[]>((acc, change) => {
    switch (change.type) {
      case "add":
        return [...acc, change.item];
      case "remove":
        return acc.filter((node) => node.id !== change.id);
      case "select":
        return acc.map((node) =>
          node.id === change.id ? { ...node, selected: change.selected ?? false } : node
        );
      case "replace":
        return acc.map((node) => (node.id === change.id ? change.item : node));
      case "position":
        return acc.map((node) =>
          node.id === change.id
            ? {
                ...node,
                position: change.position ?? node.position,
                positionAbsolute: change.positionAbsolute ?? node.positionAbsolute,
              }
            : node
        );
      default:
        return acc;
    }
  }, nodes);

export const applyEdgeChanges = (
  edges: Edge[],
  changes: EdgeChange[]
): Edge[] =>
  changes.reduce<Edge[]>((acc, change) => {
    switch (change.type) {
      case "add":
        return [...acc, change.item];
      case "remove":
        return acc.filter((edge) => edge.id !== change.id);
      case "select":
        return acc.map((edge) =>
          edge.id === change.id ? { ...edge, selected: change.selected ?? false } : edge
        );
      default:
        return acc;
    }
  }, edges);
