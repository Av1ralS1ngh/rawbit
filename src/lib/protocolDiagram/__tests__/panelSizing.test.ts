import { describe, expect, it } from "vitest";

import { getDefaultProtocolPanelWidth } from "@/lib/protocolDiagram/panelSizing";

describe("getDefaultProtocolPanelWidth", () => {
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: width,
    });
  };

  it("uses 40% of viewport width for normal desktop sizes", () => {
    setViewportWidth(1500);
    expect(getDefaultProtocolPanelWidth()).toBe(600);
  });

  it("clamps to minimum width on narrow viewports", () => {
    setViewportWidth(700);
    expect(getDefaultProtocolPanelWidth()).toBe(320);
  });

  it("clamps to maximum width on very wide viewports", () => {
    setViewportWidth(4000);
    expect(getDefaultProtocolPanelWidth()).toBe(1200);
  });
});
