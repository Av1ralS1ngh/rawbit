import { createContext } from "react";

export type FlowAction = () => void;

export interface FlowActionsContextValue {
  groupWithUndo: FlowAction;
  ungroupWithUndo: FlowAction;
}

const noop = () => undefined;

export const FlowActionsContext = createContext<FlowActionsContextValue>({
  groupWithUndo: noop,
  ungroupWithUndo: noop,
});
