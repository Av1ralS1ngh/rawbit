import { describe, expect, it } from "vitest";
import { formatBytes, measureFlowBytes, FLOW_SCHEMA_VERSION } from "@/lib/flow/schema";
import { validateFlowData } from "@/lib/flow/validate";
import type { FlowData, FlowNode } from "@/types";
import type { Edge } from "@xyflow/react";

function makeNode(id: string, overrides: Partial<FlowNode["data"]> = {}): FlowNode {
  return {
    id,
    type: "calculation",
    position: { x: 0, y: 0 },
    data: { functionName: "identity", numInputs: 1, ...overrides },
  } as FlowNode;
}

describe("flow schema helpers", () => {
  it("measures payload bytes using UTF-8 encoding", () => {
    expect(measureFlowBytes("hello")).toBe(5);
    expect(measureFlowBytes("€")).toBe(3);
  });

  it("formats bytes with human-friendly units", () => {
    expect(formatBytes(999)).toBe("999 B");
    expect(formatBytes(1024)).toBe("1.00 KiB");
    expect(formatBytes(2048)).toBe("2.00 KiB");
  });
});

describe("validateFlowData", () => {
  it("returns warnings when schema version is missing", () => {
    const node = makeNode("a");
    const edge: Edge = {
      id: "e1",
      source: "a",
      target: "a",
      sourceHandle: "input-0",
      targetHandle: "input-0",
    } as Edge;

    const result = validateFlowData({ nodes: [node], edges: [edge] } as FlowData);

    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.code === "SCHEMA_VERSION_MISSING")).toBe(true);
  });

  it("flags duplicate node ids and unknown types", () => {
    const nodeA = makeNode("dup");
    const nodeB = { ...makeNode("dup"), type: "unknown" };

    const result = validateFlowData({
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [nodeA, nodeB],
      edges: [],
    } as FlowData);

    expect(result.ok).toBe(false);
    const codes = result.errors.map((err) => err.code);
    expect(codes).toEqual(expect.arrayContaining(["NODE_ID_DUPLICATE", "NODE_TYPE_UNKNOWN"]));
  });

  it("detects missing target handles and duplicate connections", () => {
    const node = makeNode("calc", {
      numInputs: 1,
      inputStructure: {
        ungrouped: [{ index: 0, label: "Input", allowEmptyBlank: false }],
      },
    });
    const edges: Edge[] = [
      {
        id: "edge-1",
        source: "source",
        target: "calc",
        targetHandle: "input-0",
      } as Edge,
      {
        id: "edge-2",
        source: "source2",
        target: "calc",
        targetHandle: "input-0",
      } as Edge,
    ];

    const result = validateFlowData({
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [node],
      edges,
    } as FlowData);

    expect(result.ok).toBe(false);
    expect(result.errors.some((err) => err.code === "EDGE_HANDLE_DUPLICATE")).toBe(true);
  });
});
