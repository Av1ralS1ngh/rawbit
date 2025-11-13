import { useContext } from "react";
import { FlowActionsContext } from "@/contexts/flow-actions";

export function useFlowActions() {
  return useContext(FlowActionsContext);
}
