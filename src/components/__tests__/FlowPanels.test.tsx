import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { FlowPanels } from "@/components/FlowPanels";
import type { FlowNode } from "@/types";
import type { Edge } from "@xyflow/react";
import type { ProtocolDiagramModel } from "@/lib/protocolDiagram/types";

const jumpTo = vi.fn();

vi.mock("@/hooks/useUndoRedo", () => ({
  useUndoRedo: () => ({
    history: [{ label: "Initial" }, { label: "Edit node" }],
    pointer: 1,
    jumpTo,
  }),
}));

const nodes: FlowNode[] = [
  {
    id: "node-1",
    type: "calculation",
    position: { x: 0, y: 0 },
    data: { title: "Node 1" },
  } as FlowNode,
];

const edges: Edge[] = [];
const protocolDiagramModel: ProtocolDiagramModel = {
  hasGroups: true,
  groups: [
    {
      id: "group-1",
      title: "Group 1",
      nodeCount: 1,
      position: { x: 0, y: 0 },
      size: { w: 300, h: 200 },
      nodes: [{ id: "node-1", title: "Node 1", localPosition: { x: 0, y: 0 } }],
      edges: [],
      lanes: [],
      sections: [],
      presentation: "full",
    },
    {
      id: "group-2",
      title: "Group 2",
      nodeCount: 1,
      position: { x: 360, y: 0 },
      size: { w: 300, h: 200 },
      nodes: [{ id: "node-2", title: "Node 2", localPosition: { x: 20, y: 20 } }],
      edges: [],
      lanes: [],
      sections: [],
      presentation: "full",
    },
  ],
  bundles: [
    {
      id: "bundle:pair:group-1->group-2",
      sourceGroupId: "group-1",
      targetGroupId: "group-2",
      semanticKey: "pair:group-1->group-2",
      label: "1 edge",
      sensitivity: "public",
      edgeIds: ["edge-1"],
      sourceNodeIds: ["node-1"],
      targetNodeIds: ["node-2"],
      count: 1,
      pairs: [{ edgeId: "edge-1", sourceNodeId: "node-1", targetNodeId: "node-2" }],
    },
  ],
};

describe("FlowPanels", () => {
  const setShowUndoRedoPanel = vi.fn();
  const setShowErrorPanel = vi.fn();
  const setShowSearchPanel = vi.fn();
  const setShowProtocolDiagramPanel = vi.fn();
  const setSearchQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPanels = () =>
    render(
      <FlowPanels
        showUndoRedoPanel
        setShowUndoRedoPanel={setShowUndoRedoPanel}
        showErrorPanel
        setShowErrorPanel={setShowErrorPanel}
        errorInfo={[{ nodeId: "node-1", error: "Boom!" }]}
        nodes={nodes}
        showSearchPanel
        setShowSearchPanel={setShowSearchPanel}
        showProtocolDiagramPanel
        setShowProtocolDiagramPanel={setShowProtocolDiagramPanel}
        protocolDiagramModel={protocolDiagramModel}
        searchQuery="hash"
        setSearchQuery={setSearchQuery}
        edges={edges}
        centerOnNode={vi.fn()}
        focusDiagramNode={vi.fn()}
        centerOnGroup={vi.fn()}
        focusConnectionEndpoints={vi.fn()}
        canvasSelectedEdgeIds={[]}
        focusSearchHit={vi.fn()}
        hasMultipleTabs
      />
    );

  it("renders the real panels and wires close handlers", () => {
    renderPanels();

    expect(screen.getByText("Undo/Redo Stack")).toBeInTheDocument();
    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search node id, name, text")).toBeInTheDocument();
    expect(screen.getByText("Flow Map")).toBeInTheDocument();

    const undoHeader = screen.getByText("Undo/Redo Stack").parentElement!;
    fireEvent.click(within(undoHeader).getByTitle("Close panel"));
    expect(setShowUndoRedoPanel).toHaveBeenCalledWith(false);

    const errorHeader = screen.getByText("Errors").parentElement!;
    fireEvent.click(within(errorHeader).getByTitle("Close panel"));
    expect(setShowErrorPanel).toHaveBeenCalledWith(false);

    const searchHeader = screen.getByText("Search").parentElement!;
    fireEvent.click(within(searchHeader).getByTitle("Close search"));
    expect(setShowSearchPanel).toHaveBeenCalledWith(false);

    const diagramHeader = screen.getByText("Flow Map").parentElement!;
    fireEvent.click(within(diagramHeader).getByTitle("Close diagram"));
    expect(setShowProtocolDiagramPanel).toHaveBeenCalledWith(false);

    expect(screen.queryByTitle("Bundle Group 1 -> Group 2 (1 edge)")).not.toBeInTheDocument();
  });
});
