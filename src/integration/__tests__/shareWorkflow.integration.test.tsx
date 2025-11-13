import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";

import { useShareFlow } from "@/hooks/useShareFlow";
import type { FlowNode } from "@/types";
import { makeFlowNode } from "@/integration/test-helpers/flowFixtures";

const shareFlowMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/share", () => ({
  shareFlow: shareFlowMock,
}));

const sampleNodes: FlowNode[] = [
  makeFlowNode({
    id: "calc-node",
    position: { x: 0, y: 0 },
    data: { functionName: "identity" },
  }),
];

function ShareHarness({ onReady }: { onReady: (share: ReturnType<typeof useShareFlow>) => void }) {
  const share = useShareFlow({
    getNodes: () => sampleNodes,
    getEdges: () => [],
  });

  useEffect(() => {
    onReady(share);
  }, [onReady, share]);

  return (
    <div>
      <div data-testid="share-open">{String(share.shareDialogOpen)}</div>
      <div data-testid="softgate-open">{String(share.softGateOpen)}</div>
      <div data-testid="share-id">{share.shareCreatedId ?? ""}</div>
      <div data-testid="info-open">{String(share.infoDialog.open)}</div>
      <div data-testid="info-message">{share.infoDialog.message}</div>
    </div>
  );
}

describe("Share workflow integration", () => {
  beforeEach(() => {
    shareFlowMock.mockReset();
  });

  it("creates share ids and keeps dialog state in sync", async () => {
    shareFlowMock.mockResolvedValueOnce({
      id: "share-id-123",
      url: "https://share.local/s/share-id-123",
      bytes: 100,
    });

    const shareRef: { current: ReturnType<typeof useShareFlow> | null } = { current: null };

    render(<ShareHarness onReady={(share) => void (shareRef.current = share)} />);

    await waitFor(() => expect(shareRef.current).not.toBeNull());

    act(() => {
      shareRef.current!.openShareDialog();
    });
    expect(screen.getByTestId("share-open").textContent).toBe("true");

    await act(async () => {
      await shareRef.current!.requestShare();
    });

    await waitFor(() => {
      expect(screen.getByTestId("share-id").textContent).not.toBe("");
    });
    expect(screen.getByTestId("share-open").textContent).toBe("true");
    expect(screen.getByTestId("softgate-open").textContent).toBe("false");
  });

  it("recovers from soft gate after Turnstile verification", async () => {
    shareFlowMock
      .mockRejectedValueOnce({ softGate: true })
      .mockResolvedValueOnce({
        id: "verified-id",
        url: "https://share.local/s/verified-id",
        bytes: 200,
      });

    const shareRef: { current: ReturnType<typeof useShareFlow> | null } = { current: null };

    render(<ShareHarness onReady={(share) => void (shareRef.current = share)} />);

    await waitFor(() => expect(shareRef.current).not.toBeNull());

    await act(async () => {
      try {
        await shareRef.current!.requestShare();
      } catch {
        /* expect soft gate */
      }
    });

    await waitFor(() =>
      expect(screen.getByTestId("softgate-open").textContent).toBe("true")
    );

    await act(async () => {
      await shareRef.current!.verifyTurnstile("token-abc");
    });

    await waitFor(() =>
      expect(screen.getByTestId("share-id").textContent).not.toBe("")
    );
    expect(screen.getByTestId("softgate-open").textContent).toBe("false");
  });

  it("surfaces info dialog on hard failures and clears pending payload", async () => {
    shareFlowMock.mockRejectedValueOnce(new Error("explode"));

    const shareRef: { current: ReturnType<typeof useShareFlow> | null } = { current: null };

    render(<ShareHarness onReady={(share) => void (shareRef.current = share)} />);

    await waitFor(() => expect(shareRef.current).not.toBeNull());

    act(() => {
      shareRef.current!.openShareDialog();
    });

    await act(async () => {
      await expect(shareRef.current!.requestShare()).rejects.toThrow("explode");
    });

    await waitFor(() =>
      expect(screen.getByTestId("info-open").textContent).toBe("true")
    );
    expect(screen.getByTestId("info-message").textContent).toBe("explode");
    expect(screen.getByTestId("share-open").textContent).toBe("true");
    expect(shareFlowMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await shareRef.current!.verifyTurnstile("token-ignored");
    });

    expect(shareFlowMock).toHaveBeenCalledTimes(1);

    act(() => {
      shareRef.current!.closeInfoDialog();
      shareRef.current!.closeShareDialog();
    });

    expect(screen.getByTestId("info-open").textContent).toBe("false");
    expect(screen.getByTestId("share-open").textContent).toBe("false");
  });
});
