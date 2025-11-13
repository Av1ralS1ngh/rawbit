export * from "./flow";
export * from "./calc";
export * from "./share";

import type { NodeData } from "./flow";

export interface NodeTemplate {
  type: string;
  label: string;
  category: string;
  subcategory: string;
  description?: string;
  functionName: string;
  nodeData: Partial<NodeData>;
}
