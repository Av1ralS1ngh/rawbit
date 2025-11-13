import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FlowNode, SharePayload } from "@/types";
import { buildFlowNode } from "@/test-utils/types";
import { useShareFlow } from "../useShareFlow";
import { buildSharePayload } from "@/lib/share/buildSharePayload";

vi.mock("@/lib/share/buildSharePayload", () => ({
  buildSharePayload: vi.fn(() => ({ mock: true })),
}));

const shareFlowMock = vi.fn<
  (payload: SharePayload, options?: { turnstileToken?: string }) =>
    Promise<{ id: string; url: string; bytes: number }>
>();
vi.mock("@/lib/share", () => ({
  shareFlow: (payload: SharePayload, options?: { turnstileToken?: string }) =>
    shareFlowMock(payload, options),
  loadShared: vi.fn(),
  getShareJsonUrl: (id: string) => `https://share.local/s/${id}`,
}));

describe("useShareFlow", () => {
  const getNodes = () =>
    [
      buildFlowNode({
        id: "n1",
        type: "calculation",
        position: { x: 0, y: 0 },
        data: { functionName: "identity" },
      }),
    ] as FlowNode[];
  const getEdges = () => [];

  afterEach(() => {
    shareFlowMock.mockReset();
    vi.clearAllMocks();
  });

  it("opens dialog when share succeeds", async () => {
    shareFlowMock.mockResolvedValue({ id: "abc", url: "", bytes: 0 });

    const { result } = renderHook(() => useShareFlow({ getNodes, getEdges }));

    let response;
    await act(async () => {
      response = await result.current.requestShare();
    });

    expect(response).toEqual({ id: "abc" });
    expect(result.current.shareDialogOpen).toBe(true);
    expect(result.current.shareCreatedId).toBe("abc");
    expect(buildSharePayload).toHaveBeenCalled();
  });

  it("handles soft gate response by opening Turnstile dialog", async () => {
    const error = Object.assign(new Error("Verification required"), {
      softGate: true,
    });
    shareFlowMock.mockRejectedValue(error);

    const { result } = renderHook(() => useShareFlow({ getNodes, getEdges }));

    await act(async () => {
      await expect(result.current.requestShare()).rejects.toThrow("Verification required");
    });

    await waitFor(() => expect(result.current.softGateOpen).toBe(true));
  });

  it("propagates info dialog message when share fails", async () => {
    const error = new Error("bad request");
    shareFlowMock.mockRejectedValue(error);

    const { result } = renderHook(() => useShareFlow({ getNodes, getEdges }));

    await act(async () => {
      await expect(result.current.requestShare()).rejects.toThrow("bad request");
    });

    await waitFor(() =>
      expect(result.current.infoDialog).toEqual({ open: true, message: "bad request" })
    );
  });

  it("retries share after Turnstile verification", async () => {
    const softGate = Object.assign(new Error("Verification required"), {
      softGate: true,
    });
    shareFlowMock.mockRejectedValueOnce(softGate);
    shareFlowMock.mockResolvedValueOnce({ id: "final", url: "", bytes: 0 });

    const { result } = renderHook(() => useShareFlow({ getNodes, getEdges }));

    await act(async () => {
      await expect(result.current.requestShare()).rejects.toThrow("Verification required");
    });

    await waitFor(() => expect(result.current.softGateOpen).toBe(true));

    await act(async () => {
      await result.current.verifyTurnstile("token-1");
    });

    expect(shareFlowMock).toHaveBeenLastCalledWith({ mock: true }, { turnstileToken: "token-1" });
    expect(result.current.shareDialogOpen).toBe(true);
    expect(result.current.shareCreatedId).toBe("final");
    expect(result.current.softGateOpen).toBe(false);
  });

  it("keeps soft gate open when verification fails again", async () => {
    const softGate = Object.assign(new Error("Verification required"), {
      softGate: true,
    });
    shareFlowMock
      .mockRejectedValueOnce(softGate)
      .mockRejectedValueOnce(softGate);

    const { result } = renderHook(() => useShareFlow({ getNodes, getEdges }));

    await act(async () => {
      await expect(result.current.requestShare()).rejects.toThrow("Verification required");
    });

    await act(async () => {
      await result.current.verifyTurnstile("token-1");
    });

    expect(result.current.softGateOpen).toBe(true);
    expect(result.current.shareDialogOpen).toBe(false);
  });
});
