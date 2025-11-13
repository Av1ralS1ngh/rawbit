import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { useSearchHighlights } from "../useSearchHighlights";
import type { FlowNode } from "@/types";

const baseNodes: FlowNode[] = [
  {
    id: "node-a",
    type: "calculation",
    position: { x: 0, y: 0 },
    data: { functionName: "identity" },
  } as FlowNode,
  {
    id: "node-b",
    type: "calculation",
    position: { x: 200, y: 0 },
    data: { functionName: "identity" },
  } as FlowNode,
];

describe("useSearchHighlights", () => {
  const centerOnNode = vi.fn();
  const clearHighlights = vi.fn();
  const setSearchQuery = vi.fn();

  beforeEach(() => {
    centerOnNode.mockReset();
    clearHighlights.mockReset();
    setSearchQuery.mockReset();
  });

  it("focuses a search hit, tags the node, and centers the view", () => {
    const hook = renderHook(() => {
      const [nodes, setNodes] = useState(
        baseNodes.map((node) => ({
          ...node,
          data: { ...node.data },
        }))
      );

      const guardedSetNodes = (updater: (nodes: FlowNode[]) => FlowNode[]) =>
        setNodes((prev) => {
          const next = updater(prev);
          const same =
            prev.length === next.length && prev.every((node, idx) => node === next[idx]);
          return same ? prev : next;
        });

      const api = useSearchHighlights({
        showSearchPanel: true,
        searchQuery: "",
        setSearchQuery,
        setNodes: guardedSetNodes,
        centerOnNode,
        clearHighlights,
      });

      return { api, nodes };
    });

    act(() => {
      hook.result.current.api.focusSearchHit("node-b", "hash");
    });

    expect(centerOnNode).toHaveBeenCalledWith("node-b");
    const updatedNodes = hook.result.current.nodes;
    expect(updatedNodes[1].data?.searchMark?.term).toBe("hash");
    expect(updatedNodes[0].data?.searchMark).toBeUndefined();
  });

  it("clears query and highlights when the panel closes", () => {
    const hook = renderHook(
      ({ showSearchPanel, searchQuery }: { showSearchPanel: boolean; searchQuery: string }) => {
        const [nodes, setNodes] = useState(
          baseNodes.map((node, index) =>
            index === 0
              ? {
                  ...node,
                  data: { ...node.data, searchMark: { term: "hash", ts: Date.now() } },
                }
              : { ...node, data: { ...node.data } }
          )
        );

        const guardedSetNodes = (updater: (nodes: FlowNode[]) => FlowNode[]) =>
          setNodes((prev) => {
            const next = updater(prev);
            const same =
              prev.length === next.length && prev.every((node, idx) => node === next[idx]);
            return same ? prev : next;
          });

        const api = useSearchHighlights({
          showSearchPanel,
          searchQuery,
          setSearchQuery,
          setNodes: guardedSetNodes,
          centerOnNode,
          clearHighlights,
        });

        return { api, nodes, setNodes: guardedSetNodes };
      },
      {
        initialProps: { showSearchPanel: true, searchQuery: "hash" },
      }
    );

    act(() => {
      hook.result.current.api.focusSearchHit("node-b", "hash");
    });

    hook.rerender({ showSearchPanel: false, searchQuery: "hash" });

    expect(setSearchQuery).toHaveBeenCalledWith("");
    expect(clearHighlights).toHaveBeenCalled();
    const updatedNodes = hook.result.current.nodes;
    expect(updatedNodes.every((node) => node.data?.searchMark === undefined)).toBe(true);
  });
});
