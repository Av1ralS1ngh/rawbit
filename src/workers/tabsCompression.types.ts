import type { FlowNode, ProtocolDiagramLayout } from "@/types";
import type { Edge } from "@xyflow/react";
import type { ScriptStepsEntry } from "@/lib/share/scriptStepsCache";

export interface WorkerFlowTabArchive {
  nodes: FlowNode[];
  edges: Edge[];
  scriptSteps?: ScriptStepsEntry[];
  protocolDiagramLayout?: ProtocolDiagramLayout;
}

export interface CompressTabRequest {
  type: "compress-tab";
  requestId: number;
  tabId: string;
  payload: WorkerFlowTabArchive;
}

export interface CompressTabResponse {
  type: "compress-tab-result";
  requestId: number;
  tabId: string;
  data?: string;
  error?: string;
}
