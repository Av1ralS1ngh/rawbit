import { UndoRedoPanel } from "@/components/layout/UndoRedoPanel";
import { ErrorPanel } from "@/components/layout/ErrorPanel";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { ProtocolDiagramPanel } from "@/components/layout/ProtocolDiagramPanel";
import type {
  CalcError,
  FlowNode,
  ProtocolDiagramGroupOffsets,
} from "@/types";
import type { ProtocolDiagramModel } from "@/lib/protocolDiagram/types";
import type { Edge } from "@xyflow/react";

interface FlowPanelsProps {
  showUndoRedoPanel: boolean;
  setShowUndoRedoPanel: (open: boolean) => void;
  showErrorPanel: boolean;
  setShowErrorPanel: (open: boolean) => void;
  errorInfo: CalcError[];
  nodes: FlowNode[];
  showSearchPanel: boolean;
  setShowSearchPanel: (open: boolean) => void;
  showProtocolDiagramPanel: boolean;
  setShowProtocolDiagramPanel: (open: boolean) => void;
  protocolDiagramModel: ProtocolDiagramModel;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  edges: Edge[];
  centerOnNode: (id: string) => void;
  focusDiagramNode: (id: string) => void;
  centerOnGroup: (groupId: string) => void;
  focusConnectionEndpoints: (edgeIds: string[], nodeIds: string[]) => void;
  canvasSelectedEdgeIds: string[];
  focusSearchHit: (id: string, term: string) => void;
  hasMultipleTabs: boolean;
  protocolDiagramOffsets?: ProtocolDiagramGroupOffsets;
  onProtocolDiagramOffsetsChange?: (
    offsets: ProtocolDiagramGroupOffsets
  ) => void;
  onProtocolPanelWidthChange?: (width: number) => void;
  onUpdateGroupComment?: (groupId: string, comment: string) => void;
}

export function FlowPanels({
  showUndoRedoPanel,
  setShowUndoRedoPanel,
  showErrorPanel,
  setShowErrorPanel,
  errorInfo,
  nodes,
  showSearchPanel,
  setShowSearchPanel,
  showProtocolDiagramPanel,
  setShowProtocolDiagramPanel,
  protocolDiagramModel,
  searchQuery,
  setSearchQuery,
  edges,
  centerOnNode,
  focusDiagramNode,
  centerOnGroup,
  focusConnectionEndpoints,
  canvasSelectedEdgeIds,
  focusSearchHit,
  hasMultipleTabs,
  protocolDiagramOffsets,
  onProtocolDiagramOffsetsChange,
  onProtocolPanelWidthChange,
  onUpdateGroupComment,
}: FlowPanelsProps) {
  return (
    <>
      <UndoRedoPanel
        isOpen={showUndoRedoPanel}
        hasVisibleTabs={hasMultipleTabs}
        onClose={() => setShowUndoRedoPanel(false)}
      />
      <ErrorPanel
        isOpen={showErrorPanel}
        errors={errorInfo}
        nodes={nodes}
        hasVisibleTabs={hasMultipleTabs}
        onSelect={centerOnNode}
        onClose={() => setShowErrorPanel(false)}
      />
      <SearchPanel
        isOpen={showSearchPanel}
        nodes={nodes}
        edges={edges}
        query={searchQuery}
        setQuery={setSearchQuery}
        hasVisibleTabs={hasMultipleTabs}
        onSelect={centerOnNode}
        onLocateMatch={focusSearchHit}
        onClose={() => setShowSearchPanel(false)}
      />
      <ProtocolDiagramPanel
        isOpen={showProtocolDiagramPanel}
        model={protocolDiagramModel}
        hasVisibleTabs={hasMultipleTabs}
        onSelectNode={focusDiagramNode}
        onSelectGroup={centerOnGroup}
        onSelectConnection={focusConnectionEndpoints}
        canvasSelectedEdgeIds={canvasSelectedEdgeIds}
        committedOffsets={protocolDiagramOffsets}
        onCommittedOffsetsChange={onProtocolDiagramOffsetsChange}
        onClose={() => setShowProtocolDiagramPanel(false)}
        onPanelWidthChange={onProtocolPanelWidthChange}
        onUpdateGroupComment={onUpdateGroupComment}
      />
    </>
  );
}
