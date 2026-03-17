export interface DiagramInnerNode {
  id: string;
  title: string;
  functionName?: string;
  resultPreview?: string;
  laneKey?: string;
  localPosition: { x: number; y: number };
}

export interface DiagramInnerEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface DiagramLane {
  key: string;
  title: string;
  nodeIds: string[];
  confidence: number;
}

export interface DiagramSection {
  id: string;
  title: string;
  count: number;
  nodeIds: string[];
}

export type DiagramGroupPresentation = "full" | "lanes" | "compressed";

export interface DiagramGroup {
  id: string;
  title: string;
  comment?: string;
  color?: string;
  nodeCount: number;
  position: { x: number; y: number };
  size: { w: number; h: number };
  nodes: DiagramInnerNode[];
  edges: DiagramInnerEdge[];
  lanes: DiagramLane[];
  sections: DiagramSection[];
  presentation: DiagramGroupPresentation;
}

export type DiagramBundleSensitivity = "public" | "secret";

export interface DiagramEdgePair {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface DiagramBundle {
  id: string;
  sourceGroupId: string;
  targetGroupId: string;
  semanticKey: string;
  label: string;
  sensitivity: DiagramBundleSensitivity;
  edgeIds: string[];
  sourceNodeIds: string[];
  targetNodeIds: string[];
  count: number;
  pairs: DiagramEdgePair[];
}

export interface ProtocolDiagramModel {
  groups: DiagramGroup[];
  bundles: DiagramBundle[];
  hasGroups: boolean;
}
