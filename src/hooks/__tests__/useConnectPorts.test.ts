import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useConnectPorts } from "../useConnectPorts";
import type { FlowNode } from "@/types";
import type { Edge } from "@xyflow/react";

const makeNode = (id: string, numInputs = 2): FlowNode =>
  ({
    id,
    type: "calculation",
    position: { x: 0, y: 0 },
    data: { functionName: id, numInputs },
  }) as FlowNode;

describe("useConnectPorts", () => {
  const nodes = [makeNode("node-a", 2), makeNode("node-b", 1), makeNode("node-c", 3)];
  const edges: Edge[] = [
    {
      id: "edge-1",
      source: "node-a",
      target: "node-b",
      sourceHandle: "output-1",
      targetHandle: "input-0",
    },
  ];

  const flushEffects = () =>
    act(async () => {
      await Promise.resolve();
    });

  it("orders allPorts based on the selected signature order", async () => {
    type SelectionProps = {
      selectedSignature: string;
      selectedNodeIds: string[];
    };

    const { result, rerender } = renderHook<
      ReturnType<typeof useConnectPorts>,
      SelectionProps
    >(
      (props: SelectionProps) =>
        useConnectPorts({
          nodes,
          edges: [],
          connectOpen: true,
          selectedSignature: props.selectedSignature,
          selectedNodeIds: props.selectedNodeIds,
          isSwapped: false,
        }),
      {
        initialProps: { selectedSignature: "", selectedNodeIds: [] },
      }
    );

    await flushEffects();

    rerender({ selectedSignature: "node-b|node-a", selectedNodeIds: ["node-b", "node-a"] });
    await flushEffects();

    await waitFor(() =>
      expect(result.current.allPorts.map((p) => p.id)).toEqual(["node-b", "node-a"])
    );
  });

  it("reuses cached ports while the dialog remains open", async () => {
    const { result, rerender } = renderHook(
      (props) =>
        useConnectPorts({
          nodes,
          edges: [],
          connectOpen: true,
          selectedSignature: "node-a|node-b",
          selectedNodeIds: ["node-a", "node-b"],
          isSwapped: props?.isSwapped ?? false,
        }),
      { initialProps: { isSwapped: false } }
    );

    await flushEffects();

    await waitFor(() => {
      expect(result.current.sourcePorts).not.toBeNull();
    });

    const firstSource = result.current.sourcePorts!;
    rerender({ isSwapped: false });
    await flushEffects();

    await waitFor(() => {
      expect(result.current.sourcePorts).toEqual(firstSource);
    });
  });

  it("invalidates cached ports when the selected signature changes", async () => {
    const { result, rerender } = renderHook(
      (selectedSignature: string) =>
        useConnectPorts({
          nodes,
          edges: [],
          connectOpen: true,
          selectedSignature,
          selectedNodeIds: selectedSignature.split("|").filter(Boolean),
          isSwapped: false,
        }),
      { initialProps: "node-a|node-b" }
    );

    await flushEffects();

    await waitFor(() => {
      expect(result.current.sourcePorts?.id).toBe("node-a");
    });

    rerender("node-b|node-c");
    await flushEffects();

    await waitFor(() => {
      expect(result.current.sourcePorts?.id).toBe("node-b");
    });
  });

  it("exposes existing edges in a simplified format", () => {
    const { result } = renderHook(() =>
      useConnectPorts({
        nodes,
        edges,
        connectOpen: true,
        selectedSignature: "",
        selectedNodeIds: [],
        isSwapped: false,
      })
    );

    expect(result.current.existingEdges).toEqual([
      {
        source: "node-a",
        target: "node-b",
        sourceHandle: "output-1",
        targetHandle: "input-0",
      },
    ]);
  });
});
