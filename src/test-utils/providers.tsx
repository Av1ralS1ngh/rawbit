import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { UndoRedoProvider } from "@/contexts/UndoRedoContext";
import { SnapshotProvider } from "@/contexts/SnapshotContext";
import type { SnapshotScheduler } from "@/hooks/useSnapshotScheduler";
import { createSnapshotScheduler } from "@/test-utils/snapshot";

export interface TestProviderProps {
  snapshotScheduler?: SnapshotScheduler;
  theme?: "light" | "dark" | "system";
}

export function TestProviders({
  children,
  snapshotScheduler,
  theme = "light",
}: PropsWithChildren<TestProviderProps>) {
  const scheduler = snapshotScheduler ?? createSnapshotScheduler();

  return (
    <ThemeProvider defaultTheme={theme}>
      <UndoRedoProvider>
        <SnapshotProvider scheduler={scheduler}>{children}</SnapshotProvider>
      </UndoRedoProvider>
    </ThemeProvider>
  );
}
