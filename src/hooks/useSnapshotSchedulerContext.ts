import { useContext } from "react";

import { SnapshotContext } from "@/contexts/snapshot";

export function useSnapshotSchedulerContext() {
  const ctx = useContext(SnapshotContext);
  if (!ctx) {
    throw new Error(
      "useSnapshotSchedulerContext must be used within a SnapshotProvider"
    );
  }
  return ctx;
}
