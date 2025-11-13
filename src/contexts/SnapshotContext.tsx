import type { ReactNode } from "react";
import { SnapshotContext } from "@/contexts/snapshot";
import type { SnapshotScheduler } from "@/hooks/useSnapshotScheduler";

interface SnapshotProviderProps {
  scheduler: SnapshotScheduler;
  children: ReactNode;
}

export function SnapshotProvider({ scheduler, children }: SnapshotProviderProps) {
  return (
    <SnapshotContext.Provider value={scheduler}>
      {children}
    </SnapshotContext.Provider>
  );
}
