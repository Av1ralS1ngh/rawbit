import type { PropsWithChildren, ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

import type { SnapshotScheduler } from "@/hooks/useSnapshotScheduler";
import { TestProviders } from "@/test-utils/providers";

interface RenderWithProvidersOptions extends RenderOptions {
  snapshotScheduler?: SnapshotScheduler;
  theme?: "light" | "dark" | "system";
}

export function renderWithProviders(
  ui: ReactElement,
  { snapshotScheduler, theme, ...options }: RenderWithProvidersOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }: PropsWithChildren) => (
      <TestProviders snapshotScheduler={snapshotScheduler} theme={theme}>
        {children}
      </TestProviders>
    ),
    ...options,
  });
}
