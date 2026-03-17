import type { DiagramBundleSensitivity, DiagramSection } from "@/lib/protocolDiagram/types";

export type DiagramArchetype =
  | "keys"
  | "aggregation"
  | "round_nonce"
  | "round_sign"
  | "sighash"
  | "final_tx"
  | "generic";

export interface SemanticUnit {
  id: string;
  label: string;
  title: string;
  nodeIds: string[];
  primaryNodeId: string;
  functionName?: string;
  sensitivity: DiagramBundleSensitivity;
}

export interface SemanticLane {
  key: string;
  title: string;
  units: SemanticUnit[];
}

export interface SemanticGroup {
  id: string;
  title: string;
  color?: string;
  nodeCount: number;
  position: { x: number; y: number };
  size: { w: number; h: number };
  archetype: DiagramArchetype;
  lanes: SemanticLane[];
  units: SemanticUnit[];
  sections: DiagramSection[];
  aggregatorUnit?: SemanticUnit;
}

export interface SemanticChannel {
  id: string;
  sourceGroupId: string;
  targetGroupId: string;
  label: string;
  sensitivity: DiagramBundleSensitivity;
  count: number;
  edgeIds: string[];
}

export interface ProtocolSemanticModel {
  groups: SemanticGroup[];
  channels: SemanticChannel[];
  hasGroups: boolean;
}
