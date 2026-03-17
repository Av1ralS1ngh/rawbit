const MIN_PROTOCOL_PANEL_WIDTH = 320;
const MAX_PROTOCOL_PANEL_WIDTH = 1200;
const DEFAULT_PROTOCOL_PANEL_WIDTH_FALLBACK = 560;
const DEFAULT_PROTOCOL_PANEL_WIDTH_RATIO = 0.4;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const getDefaultProtocolPanelWidth = (): number => {
  if (typeof window === "undefined") return DEFAULT_PROTOCOL_PANEL_WIDTH_FALLBACK;
  const viewportWidth = window.innerWidth;
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return DEFAULT_PROTOCOL_PANEL_WIDTH_FALLBACK;
  }
  return clamp(
    Math.round(viewportWidth * DEFAULT_PROTOCOL_PANEL_WIDTH_RATIO),
    MIN_PROTOCOL_PANEL_WIDTH,
    MAX_PROTOCOL_PANEL_WIDTH
  );
};

export {
  MIN_PROTOCOL_PANEL_WIDTH,
  MAX_PROTOCOL_PANEL_WIDTH,
  DEFAULT_PROTOCOL_PANEL_WIDTH_FALLBACK,
};
