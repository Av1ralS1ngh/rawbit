import type { ReactNode } from "react";
import type { FlowActionsContextValue } from "@/contexts/flow-actions";
import { FlowActionsContext } from "@/contexts/flow-actions";

interface FlowActionsProviderProps {
  value: FlowActionsContextValue;
  children: ReactNode;
}

export function FlowActionsProvider({
  value,
  children,
}: FlowActionsProviderProps) {
  return (
    <FlowActionsContext.Provider value={value}>
      {children}
    </FlowActionsContext.Provider>
  );
}
