import { createContext } from "react";

import type { SnapshotScheduler } from "@/hooks/useSnapshotScheduler";

export const SnapshotContext = createContext<SnapshotScheduler | null>(null);
