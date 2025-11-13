import type { XYPosition } from "@xyflow/react";

export interface FlowFileCandidate {
  nodes: unknown[];
  edges: unknown[];
  schemaVersion?: unknown;
  name?: unknown;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isXYPosition = (value: unknown): value is XYPosition =>
  isRecord(value) &&
  typeof value.x === "number" &&
  typeof value.y === "number";

export const isFlowFileCandidate = (
  value: unknown
): value is FlowFileCandidate =>
  isRecord(value) && Array.isArray(value.nodes) && Array.isArray(value.edges);
