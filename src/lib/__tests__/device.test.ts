import { describe, expect, it } from "vitest";

import { DESKTOP_BREAKPOINT, shouldBlockMobile } from "../device";

const belowDesktop = DESKTOP_BREAKPOINT - 1;

describe("shouldBlockMobile", () => {
  it("blocks common mobile user agents below the breakpoint", () => {
    expect(
      shouldBlockMobile({ width: belowDesktop, userAgent: "Mozilla/5.0 iPhone" })
    ).toBe(true);
  });

  it("does not block wide screens even with mobile UA", () => {
    expect(
      shouldBlockMobile({
        width: DESKTOP_BREAKPOINT + 200,
        userAgent: "iPad",
      })
    ).toBe(false);
  });

  it("blocks when coarse pointer is detected on small viewports", () => {
    expect(
      shouldBlockMobile({ width: belowDesktop, coarsePointer: true })
    ).toBe(true);
  });

  it("blocks when userAgentData reports mobile", () => {
    expect(
      shouldBlockMobile({
        width: belowDesktop,
        userAgentDataMobile: true,
      })
    ).toBe(true);
  });

  it("does not block desktop-like environments", () => {
    expect(
      shouldBlockMobile({
        width: belowDesktop,
        userAgent: "Mozilla/5.0 (Macintosh)",
        coarsePointer: false,
        userAgentDataMobile: false,
      })
    ).toBe(false);
  });

  it("ignores invalid widths", () => {
    expect(
      shouldBlockMobile({
        width: 0,
        userAgent: "iPhone",
        coarsePointer: true,
      })
    ).toBe(false);
  });
});
