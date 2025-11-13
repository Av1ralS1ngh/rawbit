import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { SoftGateDialog } from "@/components/share/SoftGateDialog";

type TurnstileMock = {
  render: (element: HTMLElement, options: { callback: (token: string) => void }) => string;
  remove?: (widgetId: string) => void;
};

describe("SoftGateDialog", () => {
  const appendStub = vi.fn((element: Node) => element);
  let originalTurnstile: TurnstileMock | undefined;

  beforeEach(() => {
    appendStub.mockImplementation((el: Node) => {
      if (el instanceof HTMLScriptElement) {
        el.onload?.(new Event("load"));
      }
      return el;
    });
    const windowWithTurnstile = window as typeof window & { turnstile?: TurnstileMock };
    originalTurnstile = windowWithTurnstile.turnstile;
    delete windowWithTurnstile.turnstile;
    vi.spyOn(document.head, "appendChild").mockImplementation(appendStub);
  });

  afterEach(() => {
    cleanup();
    appendStub.mockReset();
    vi.restoreAllMocks();
    const windowWithTurnstile = window as typeof window & { turnstile?: TurnstileMock };
    if (originalTurnstile === undefined) delete windowWithTurnstile.turnstile;
    else windowWithTurnstile.turnstile = originalTurnstile;
  });

  it("loads Turnstile script when opening", async () => {
    render(
      <SoftGateDialog open onClose={vi.fn()} onVerified={vi.fn()} />
    );

    await waitFor(() => expect(appendStub).toHaveBeenCalled());
    expect(screen.getByText(/Quick verification/i)).toBeInTheDocument();
  });

  it("renders widget and cleans up when closing", async () => {
    const onVerified = vi.fn();
    const remove = vi.fn();
    const renderWidget = vi.fn(
      (_element: HTMLElement, opts: { callback: (token: string) => void }) => {
        opts.callback("token-42");
        return "widget-id";
      }
    );

    const windowWithTurnstile = window as typeof window & { turnstile?: TurnstileMock };
    windowWithTurnstile.turnstile = {
      render: renderWidget,
      remove,
    };

    const { rerender, unmount } = render(
      <SoftGateDialog open onClose={vi.fn()} onVerified={onVerified} />
    );

    await waitFor(() => expect(renderWidget).toHaveBeenCalled());
    expect(onVerified).toHaveBeenCalledWith("token-42");

    rerender(
      <SoftGateDialog open={false} onClose={vi.fn()} onVerified={onVerified} />
    );
    unmount();

    expect(remove).toHaveBeenCalledWith("widget-id");
  });
});
