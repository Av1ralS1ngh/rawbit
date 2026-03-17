import { describe, expect, it } from "vitest";
import type { Edge } from "@xyflow/react";

import { buildProtocolDiagramModel } from "@/lib/protocolDiagram/buildProtocolDiagramModel";
import { buildEdge, buildFlowNode } from "@/test-utils/types";
import type { FlowNode } from "@/types";

describe("buildProtocolDiagramModel", () => {
  it("returns empty output when there are no group nodes", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "n1",
        type: "calculation",
        data: { title: "Identity" },
      }),
    ];
    const model = buildProtocolDiagramModel({ nodes, edges: [] });
    expect(model.hasGroups).toBe(false);
    expect(model.groups).toEqual([]);
    expect(model.bundles).toEqual([]);
  });

  it("extracts groups and child nodes in stable position order", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "group-1",
        type: "shadcnGroup",
        position: { x: 20, y: 40 },
        data: {
          title: "Keys",
          comment: "Creates participant key material.",
          borderColor: "#22c55e",
          width: 420,
          height: 320,
        },
      }),
      buildFlowNode({
        id: "group-2",
        type: "shadcnGroup",
        position: { x: 800, y: 40 },
        data: { title: "Sign", borderColor: "#f97316" },
      }),
      buildFlowNode({
        id: "node-b",
        parentId: "group-1",
        type: "calculation",
        position: { x: 120, y: 160 },
        data: { title: "Node B", functionName: "identity" },
      }),
      buildFlowNode({
        id: "node-a",
        parentId: "group-1",
        type: "calculation",
        position: { x: 40, y: 80 },
        data: { title: "Node A", functionName: "identity" },
      }),
      buildFlowNode({
        id: "node-c",
        parentId: "group-2",
        type: "calculation",
        position: { x: 32, y: 48 },
        data: { title: "Node C", functionName: "sha256_hex" },
      }),
      buildFlowNode({
        id: "standalone",
        type: "calculation",
        position: { x: 0, y: 0 },
        data: { title: "Ungrouped" },
      }),
    ];

    const model = buildProtocolDiagramModel({ nodes, edges: [] });

    expect(model.hasGroups).toBe(true);
    expect(model.groups).toHaveLength(2);
    expect(model.groups[0]).toMatchObject({
      id: "group-1",
      title: "Keys",
      comment: "Creates participant key material.",
      color: "#22c55e",
      nodeCount: 2,
      size: { w: 420, h: 320 },
      presentation: "full",
    });
    expect(model.groups[0].nodes.map((node) => node.id)).toEqual([
      "node-a",
      "node-b",
    ]);
    expect(model.groups[1]).toMatchObject({
      id: "group-2",
      title: "Sign",
      color: "#f97316",
      nodeCount: 1,
      presentation: "full",
    });
    expect(model.groups[1].nodes[0]?.id).toBe("node-c");
    expect(model.groups[0].lanes).toEqual([]);
    expect(model.groups[0].sections).toEqual([]);
  });

  it("aggregates directed cross-group bundles by source and target groups", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "group-1",
        type: "shadcnGroup",
        data: { title: "Group 1" },
      }),
      buildFlowNode({
        id: "group-2",
        type: "shadcnGroup",
        data: { title: "Group 2" },
      }),
      buildFlowNode({
        id: "a1",
        parentId: "group-1",
        type: "calculation",
        data: { title: "A1", functionName: "identity" },
      }),
      buildFlowNode({
        id: "a2",
        parentId: "group-1",
        type: "calculation",
        data: { title: "A2", functionName: "identity" },
      }),
      buildFlowNode({
        id: "b1",
        parentId: "group-2",
        type: "calculation",
        data: { title: "B1" },
      }),
      buildFlowNode({
        id: "free",
        type: "calculation",
        data: { title: "Free Node" },
      }),
    ];

    const edges: Edge[] = [
      buildEdge({ id: "e1", source: "a1", target: "b1" }),
      buildEdge({ id: "e2", source: "a2", target: "b1" }),
      buildEdge({ id: "e3", source: "b1", target: "a1" }),
      buildEdge({ id: "e4", source: "a1", target: "a2" }),
      buildEdge({ id: "e5", source: "free", target: "b1" }),
    ];

    const model = buildProtocolDiagramModel({ nodes, edges });
    expect(model.bundles).toHaveLength(2);

    const forward = model.bundles.find(
      (bundle) =>
        bundle.sourceGroupId === "group-1" && bundle.targetGroupId === "group-2"
    );
    const reverse = model.bundles.find(
      (bundle) =>
        bundle.sourceGroupId === "group-2" && bundle.targetGroupId === "group-1"
    );

    expect(forward).toMatchObject({
      semanticKey: "pair:group-1->group-2",
      label: "2 edges",
      count: 2,
      edgeIds: ["e1", "e2"],
      sourceNodeIds: ["a1", "a2"],
      targetNodeIds: ["b1"],
      pairs: [
        { edgeId: "e1", sourceNodeId: "a1", targetNodeId: "b1" },
        { edgeId: "e2", sourceNodeId: "a2", targetNodeId: "b1" },
      ],
    });
    expect(reverse).toMatchObject({
      semanticKey: "pair:group-2->group-1",
      label: "1 edge",
      count: 1,
      edgeIds: ["e3"],
      sourceNodeIds: ["b1"],
      targetNodeIds: ["a1"],
      pairs: [
        { edgeId: "e3", sourceNodeId: "b1", targetNodeId: "a1" },
      ],
    });
  });

  it("keeps one bundle per group pair even when source handles differ", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "group-1",
        type: "shadcnGroup",
        data: { title: "Group 1" },
      }),
      buildFlowNode({
        id: "group-2",
        type: "shadcnGroup",
        data: { title: "Group 2" },
      }),
      buildFlowNode({
        id: "nonce-node",
        parentId: "group-1",
        type: "calculation",
        data: {
          title: "Nonce Gen",
          functionName: "musig2_nonce_gen",
          outputPorts: [
            { label: "pubnonce (66B)", handleId: "" },
            { label: "secnonce (97B)", handleId: "output-1" },
          ],
        },
      }),
      buildFlowNode({
        id: "target",
        parentId: "group-2",
        type: "calculation",
        data: { title: "Target" },
      }),
    ];

    const edges: Edge[] = [
      buildEdge({ id: "pub-1", source: "nonce-node", target: "target" }),
      buildEdge({
        id: "sec-1",
        source: "nonce-node",
        sourceHandle: "output-1",
        target: "target",
      }),
    ];

    const model = buildProtocolDiagramModel({ nodes, edges });
    expect(model.bundles).toHaveLength(1);
    expect(model.bundles[0]).toMatchObject({
      semanticKey: "pair:group-1->group-2",
      label: "2 edges",
      sensitivity: "public",
      count: 2,
      edgeIds: ["pub-1", "sec-1"],
      sourceNodeIds: ["nonce-node"],
      targetNodeIds: ["target"],
    });
  });

  it("uses lane presentation when participant rows are detected", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "keys",
        type: "shadcnGroup",
        data: { title: "Keys" },
      }),
      buildFlowNode({
        id: "alice-sk",
        parentId: "keys",
        type: "calculation",
        position: { x: 10, y: 10 },
        data: { title: "Alice sk", functionName: "even_y_private_key" },
      }),
      buildFlowNode({
        id: "alice-pk",
        parentId: "keys",
        type: "calculation",
        position: { x: 120, y: 10 },
        data: { title: "Alice pk", functionName: "xonly_pubkey" },
      }),
      buildFlowNode({
        id: "bob-sk",
        parentId: "keys",
        type: "calculation",
        position: { x: 10, y: 120 },
        data: { title: "Bob sk", functionName: "even_y_private_key" },
      }),
      buildFlowNode({
        id: "bob-pk",
        parentId: "keys",
        type: "calculation",
        position: { x: 120, y: 120 },
        data: { title: "Bob pk", functionName: "xonly_pubkey" },
      }),
      buildFlowNode({
        id: "charlie-sk",
        parentId: "keys",
        type: "calculation",
        position: { x: 10, y: 230 },
        data: { title: "Charlie sk", functionName: "even_y_private_key" },
      }),
      buildFlowNode({
        id: "charlie-pk",
        parentId: "keys",
        type: "calculation",
        position: { x: 120, y: 230 },
        data: { title: "Charlie pk", functionName: "xonly_pubkey" },
      }),
    ];

    const model = buildProtocolDiagramModel({ nodes, edges: [] });
    expect(model.groups[0]?.presentation).toBe("lanes");
    expect(model.groups[0]?.lanes.map((lane) => lane.key)).toEqual([
      "alice",
      "bob",
      "charlie",
    ]);
    expect(
      model.groups[0]?.nodes.filter((node) => node.laneKey === "alice").length
    ).toBe(2);
  });

  it("uses compressed presentation for dense sighash-like groups", () => {
    const groupId = "sighash";
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: groupId,
        type: "shadcnGroup",
        data: { title: "SigHash" },
      }),
    ];

    for (let i = 0; i < 8; i += 1) {
      nodes.push(
        buildFlowNode({
          id: `in-${i}`,
          parentId: groupId,
          type: "calculation",
          position: { x: i * 10, y: 20 },
          data: { functionName: "uint32_to_little_endian_4_bytes" },
        })
      );
    }
    for (let i = 0; i < 8; i += 1) {
      nodes.push(
        buildFlowNode({
          id: `hash-${i}`,
          parentId: groupId,
          type: "calculation",
          position: { x: i * 10, y: 80 },
          data: { functionName: "sha256_hex" },
        })
      );
    }
    for (let i = 0; i < 3; i += 1) {
      nodes.push(
        buildFlowNode({
          id: `concat-${i}`,
          parentId: groupId,
          type: "calculation",
          position: { x: i * 10, y: 140 },
          data: { functionName: "concat_all" },
        })
      );
    }

    const model = buildProtocolDiagramModel({ nodes, edges: [] });
    expect(model.groups[0]?.presentation).toBe("compressed");
    expect(model.groups[0]?.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining(["TX Inputs", "Hash Pipeline", "Preimage Assembly"])
    );
  });

  it("excludes text info nodes from flow map groups and bundles", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "group-1",
        type: "shadcnGroup",
        data: { title: "Group 1" },
      }),
      buildFlowNode({
        id: "group-2",
        type: "shadcnGroup",
        data: { title: "Group 2" },
      }),
      buildFlowNode({
        id: "a-calc",
        parentId: "group-1",
        type: "calculation",
        data: { title: "A Calc" },
      }),
      buildFlowNode({
        id: "a-text",
        parentId: "group-1",
        type: "shadcnTextInfo",
        data: { title: "A Note" },
      }),
      buildFlowNode({
        id: "b-calc",
        parentId: "group-2",
        type: "calculation",
        data: { title: "B Calc" },
      }),
    ];

    const edges: Edge[] = [
      buildEdge({ id: "calc-edge", source: "a-calc", target: "b-calc" }),
      buildEdge({ id: "text-edge", source: "a-text", target: "b-calc" }),
    ];

    const model = buildProtocolDiagramModel({ nodes, edges });

    const group1 = model.groups.find((group) => group.id === "group-1");
    expect(group1).toBeDefined();
    expect(group1?.nodeCount).toBe(1);
    expect(group1?.nodes.map((node) => node.id)).toEqual(["a-calc"]);

    expect(model.bundles).toHaveLength(1);
    expect(model.bundles[0]).toMatchObject({
      sourceGroupId: "group-1",
      targetGroupId: "group-2",
      edgeIds: ["calc-edge"],
      sourceNodeIds: ["a-calc"],
      targetNodeIds: ["b-calc"],
      count: 1,
      pairs: [{ edgeId: "calc-edge", sourceNodeId: "a-calc", targetNodeId: "b-calc" }],
    });
  });

  it("omits groups flagged as excluded from flow map and drops their connections", () => {
    const nodes: FlowNode[] = [
      buildFlowNode({
        id: "group-hidden",
        type: "shadcnGroup",
        data: { title: "Hidden", excludeFromFlowMap: true },
      }),
      buildFlowNode({
        id: "group-visible",
        type: "shadcnGroup",
        data: { title: "Visible" },
      }),
      buildFlowNode({
        id: "hidden-node",
        parentId: "group-hidden",
        type: "calculation",
        data: { title: "Hidden Node" },
      }),
      buildFlowNode({
        id: "visible-node",
        parentId: "group-visible",
        type: "calculation",
        data: { title: "Visible Node" },
      }),
    ];

    const edges: Edge[] = [
      buildEdge({ id: "hidden-to-visible", source: "hidden-node", target: "visible-node" }),
      buildEdge({ id: "visible-to-hidden", source: "visible-node", target: "hidden-node" }),
    ];

    const model = buildProtocolDiagramModel({ nodes, edges });

    expect(model.hasGroups).toBe(true);
    expect(model.groups.map((group) => group.id)).toEqual(["group-visible"]);
    expect(model.groups[0]?.nodes.map((node) => node.id)).toEqual(["visible-node"]);
    expect(model.bundles).toEqual([]);
  });
});
