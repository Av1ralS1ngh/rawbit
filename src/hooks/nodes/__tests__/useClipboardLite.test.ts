import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useClipboardLite } from "../useClipboardLite";

const setClipboardStub = (clip?: Pick<Clipboard, "writeText">) => {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: clip ? (clip as Clipboard) : undefined,
  });
};

describe("useClipboardLite", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setClipboardStub();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setClipboardStub();
    Reflect.deleteProperty(document, "execCommand");
  });

  it("serialises objects and toggles result copy feedback", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    setClipboardStub({ writeText });

    const { result } = renderHook(() =>
      useClipboardLite({
        result: { foo: "bar" },
        rawTitle: "Node",
        id: "abc",
      })
    );

    expect(result.current.prettyResult).toBe(`{
  "foo": "bar"
}`);

    await act(async () => {
      result.current.copyResult();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith(result.current.prettyResult);
    expect(result.current.resultCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.resultCopied).toBe(false);
  });

  it("falls back to execCommand for error copy", () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    vi.spyOn(document, "execCommand");

    const { result } = renderHook(() =>
      useClipboardLite({
        result: undefined,
        rawTitle: "Calc",
        id: "calc-1",
        extendedError: "Boom",
      })
    );

    act(() => {
      result.current.copyError();
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(result.current.errorCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.errorCopied).toBe(false);
  });

  it("copies composite node identifiers", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    setClipboardStub({ writeText });

    const { result } = renderHook(() =>
      useClipboardLite({
        result: "ready",
        rawTitle: "Script",
        id: "node-9",
      })
    );

    await act(async () => {
      result.current.copyId();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("Script node-9");
    expect(result.current.idCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.idCopied).toBe(false);
  });
});
