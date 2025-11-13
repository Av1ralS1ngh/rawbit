// Shared markers for node field values. These must stay in sync with
// backend/graph_logic.py so the API understands the UI's forced-empty/forced-"00" states.
export const SENTINEL_EMPTY = "__EMPTY__";
export const SENTINEL_FORCE00 = "__FORCE00__";

// Virtual list tuning for calculation node field renders.
export const VIRTUALIZE_THRESHOLD = 40; // switch to virtualization when field count exceeds this
export const FIELD_ROW_HEIGHT = 78; // fixed row height in the virtualized list
export const VIRTUAL_MAX_HEIGHT = 400; // cap list height so long forms stay scrollable
export const VIRTUAL_OVERSCAN = 6; // render a few extra items above/below for smooth scrolling
