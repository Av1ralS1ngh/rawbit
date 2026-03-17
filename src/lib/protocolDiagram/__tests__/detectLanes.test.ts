import { describe, expect, it } from "vitest";

import { detectLanes } from "@/lib/protocolDiagram/detectLanes";
import { buildFlowNode } from "@/test-utils/types";
import type { FlowNode } from "@/types";

describe("detectLanes", () => {
  it("detects participant lanes from title tokens", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "a1",
        position: { x: 0, y: 0 },
        data: { title: "Alice Nonce" },
      }),
      buildFlowNode({
        id: "a2",
        position: { x: 100, y: 0 },
        data: { title: "Alice PubKey" },
      }),
      buildFlowNode({
        id: "b1",
        position: { x: 0, y: 100 },
        data: { title: "Bob Nonce" },
      }),
      buildFlowNode({
        id: "b2",
        position: { x: 100, y: 100 },
        data: { title: "Bob PubKey" },
      }),
    ];

    const result = detectLanes({ nodes });

    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.lanes.map((lane) => lane.key)).toEqual(["alice", "bob"]);
    expect(result.lanes[0]?.nodeIds).toEqual(["a1", "a2"]);
    expect(result.lanes[1]?.nodeIds).toEqual(["b1", "b2"]);
  });

  it("falls back to y-cluster lanes when participant tokens are absent", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "n1",
        position: { x: 0, y: 0 },
        data: { title: "Step 1" },
      }),
      buildFlowNode({
        id: "n2",
        position: { x: 120, y: 10 },
        data: { title: "Step 2" },
      }),
      buildFlowNode({
        id: "n3",
        position: { x: 0, y: 140 },
        data: { title: "Step 3" },
      }),
      buildFlowNode({
        id: "n4",
        position: { x: 120, y: 150 },
        data: { title: "Step 4" },
      }),
      buildFlowNode({
        id: "n5",
        position: { x: 0, y: 280 },
        data: { title: "Step 5" },
      }),
      buildFlowNode({
        id: "n6",
        position: { x: 120, y: 290 },
        data: { title: "Step 6" },
      }),
    ];

    const result = detectLanes({ nodes });
    expect(result.lanes.map((lane) => lane.key)).toEqual([
      "row_1",
      "row_2",
      "row_3",
    ]);
    expect(result.confidence).toBe(0.6);
  });
});
