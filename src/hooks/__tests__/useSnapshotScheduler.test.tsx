import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FlowNode } from "@/types";
import type { Edge } from "@xyflow/react";
import { useSnapshotScheduler } from "../useSnapshotScheduler";

const makeState = () => ({
  nodes: [
    {
      id: "n1",
      type: "calculation",
      position: { x: 0, y: 0 },
      data: { functionName: "identity", dirty: true },
    },
  ] as FlowNode[],
  edges: [] as Edge[],
});

describe("useSnapshotScheduler", () => {
  let storeState: ReturnType<typeof makeState>;
  let pushState: ReturnType<typeof vi.fn>;
  let incrementGraphRev: ReturnType<typeof vi.fn>;
  let skipLoadRef: React.MutableRefObject<boolean>;
  let refreshBanner: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    storeState = makeState();
    pushState = vi.fn();
    incrementGraphRev = vi.fn(() => 7);
    skipLoadRef = { current: false };
    refreshBanner = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderScheduler = (
    autoAfterCalc?: Parameters<typeof useSnapshotScheduler>[0]["autoAfterCalc"],
    getCalcSnapshot?: Parameters<typeof useSnapshotScheduler>[0]["getCalcSnapshot"]
  ) =>
    renderHook(() =>
      useSnapshotScheduler({
        storeApi: { getState: () => storeState },
        pushState,
        incrementGraphRev,
        skipLoadRef,
        refreshBanner,
        autoAfterCalc,
        getCalcSnapshot,
      })
    );

  it("captures snapshots and clears dirty flags", () => {
    const { result } = renderScheduler();

    act(() => {
      result.current.scheduleSnapshot("Manual snapshot");
    });

    expect(incrementGraphRev).toHaveBeenCalled();
    expect(pushState).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({ dirty: false }),
        }),
      ]),
      storeState.edges,
      expect.objectContaining({ label: "Manual snapshot" })
    );
  });

  it("respects refresh flag and before guard", () => {
    const { result } = renderScheduler();
    const guard = vi.fn(() => false);

    act(() => {
      result.current.scheduleSnapshot("Needs refresh", { refresh: true, before: guard });
    });

    expect(refreshBanner).toHaveBeenCalledWith(storeState.nodes, undefined, {
      sticky: false,
      immediate: true,
    });
    expect(guard).toHaveBeenCalled();
  });

  it("passes calc state metadata when capturing snapshots", () => {
    const calcSnapshot = {
      status: "ERROR" as const,
      errors: [{ nodeId: "n1", error: "boom" }],
    };
    const { result } = renderScheduler(undefined, () => calcSnapshot);

    act(() => {
      result.current.scheduleSnapshot("With calc state");
    });

    expect(pushState).toHaveBeenCalledWith(
      expect.any(Array),
      storeState.edges,
      expect.objectContaining({
        label: "With calc state",
        calcState: expect.objectContaining({
          status: "ERROR",
          errors: [expect.objectContaining({ nodeId: "n1", error: "boom" })],
        }),
      })
    );
  });

  it("marks and clears pending snapshot flags", () => {
    const { result } = renderScheduler();

    act(() => {
      result.current.markPendingAfterDirtyChange();
    });

    expect(result.current.pendingSnapshotRef.current).toBe(true);

    act(() => {
      result.current.clearPendingAfterCalc();
    });

    expect(result.current.pendingSnapshotRef.current).toBe(false);
    expect(result.current.skipNextEdgeSnapshotRef.current).toBe(false);
  });

  it("locks and releases edge snapshot skip", () => {
    const { result } = renderScheduler();

    act(() => {
      result.current.lockEdgeSnapshotSkip();
    });
    expect(result.current.skipNextEdgeSnapshotRef.current).toBe(true);

    act(() => {
      result.current.releaseEdgeSnapshotSkip();
    });
    expect(result.current.skipNextEdgeSnapshotRef.current).toBe(false);
  });

  it("locks and releases node removal snapshot skip", () => {
    const { result } = renderScheduler();

    act(() => {
      result.current.lockNodeRemovalSnapshotSkip();
    });
    expect(result.current.skipNextNodeRemovalRef.current).toBe(true);

    act(() => {
      result.current.releaseNodeRemovalSnapshotSkip();
    });
    expect(result.current.skipNextNodeRemovalRef.current).toBe(false);
  });
});
