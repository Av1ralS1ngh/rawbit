import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

const syntaxPropsSpy = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@/components/ui/dialog", () => {
  const Dialog = ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="mock-dialog">{children}</div> : null);

  const wrap =
    (Tag: keyof JSX.IntrinsicElements) =>
    ({ children, className }: { children: React.ReactNode; className?: string }) =>
      React.createElement(Tag, { className }, children);

  return {
    Dialog,
    DialogContent: wrap("div"),
    DialogDescription: wrap("p"),
    DialogFooter: wrap("div"),
    DialogHeader: wrap("div"),
    DialogTitle: wrap("h2"),
  };
});

vi.mock("react-syntax-highlighter", () => ({
  Prism: (props: Record<string, unknown>) => {
    syntaxPropsSpy(props);
    return <pre data-testid="syntax-code">{props.children as React.ReactNode}</pre>;
  },
}));

import NodeCodeDialog from "../NodeCodeDialog";

describe("NodeCodeDialog", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    syntaxPropsSpy.mockClear();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ code: "def sample():\n    return 'ok'" }),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders code with non-wrapping highlighter configuration", async () => {
    render(
      <NodeCodeDialog
        open
        onClose={vi.fn()}
        functionName="public_key_from_private_key"
      />
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/code?functionName=public_key_from_private_key")
      )
    );

    await waitFor(() => expect(screen.getByTestId("syntax-code")).toBeInTheDocument());
    expect(syntaxPropsSpy).toHaveBeenCalled();

    const lastCall = syntaxPropsSpy.mock.calls.at(-1)?.[0] as {
      wrapLongLines?: boolean;
      customStyle?: { whiteSpace?: string };
    };

    expect(lastCall.wrapLongLines).toBe(false);
    expect(lastCall.customStyle?.whiteSpace).toBe("pre");
  });
});
