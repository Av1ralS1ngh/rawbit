import { describe, expect, it } from "vitest";

import { compressGroup } from "@/lib/protocolDiagram/groupCompression";
import { buildEdge, buildFlowNode } from "@/test-utils/types";
import type { Edge } from "@xyflow/react";
import type { FlowNode } from "@/types";

describe("compressGroup", () => {
  it("compresses sighash-like groups into semantic sections", () => {
    const groupId = "sighash";
    const nodes: FlowNode[] = [];

    for (let i = 0; i < 6; i += 1) {
      nodes.push(
        buildFlowNode({
          id: `input-${i}`,
          parentId: groupId,
          data: { functionName: "uint32_to_little_endian_4_bytes" },
        })
      );
    }
    for (let i = 0; i < 6; i += 1) {
      nodes.push(
        buildFlowNode({
          id: `hash-${i}`,
          parentId: groupId,
          data: { functionName: "sha256_hex" },
        })
      );
    }
    for (let i = 0; i < 2; i += 1) {
      nodes.push(
        buildFlowNode({
          id: `concat-${i}`,
          parentId: groupId,
          data: { functionName: "concat_all" },
        })
      );
    }

    const result = compressGroup({
      groupId,
      groupTitle: "SigHash",
      nodes,
      edges: [],
    });

    expect(result.shouldCompress).toBe(true);
    expect(result.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining(["TX Inputs", "Hash Pipeline", "Preimage Assembly"])
    );
  });

  it("uses depth-based chunking for unknown dense groups", () => {
    const groupId = "infra";
    const nodes: FlowNode[] = Array.from({ length: 18 }, (_, index) =>
      buildFlowNode({
        id: `node-${index + 1}`,
        parentId: groupId,
        position: { x: index * 10, y: index * 10 },
        data: { functionName: index % 2 === 0 ? "identity" : "sha256_hex" },
      })
    );

    const edges: Edge[] = [];
    for (let i = 0; i < nodes.length - 1; i += 1) {
      edges.push(
        buildEdge({
          id: `edge-${i + 1}`,
          source: nodes[i]!.id,
          target: nodes[i + 1]!.id,
        })
      );
    }

    const result = compressGroup({
      groupId,
      groupTitle: "Infrastructure",
      nodes,
      edges,
    });

    expect(result.shouldCompress).toBe(true);
    expect(result.sections.length).toBeGreaterThanOrEqual(3);
    expect(result.sections.length).toBeLessThanOrEqual(8);
    expect(result.sections.reduce((sum, section) => sum + section.count, 0)).toBe(
      nodes.length
    );
  });
});
