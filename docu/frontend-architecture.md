# Frontend Architecture Guide

This guide explains how the visual editor is composed, how state flows between providers and hooks, and where to extend behaviour when new features land.

## Top-Level Composition (`Flow.tsx`)

The main entry point is `Flow.tsx`, which wraps the canvas with three key providers before rendering the editor surface:

- **`UndoRedoProvider`** – maintains per-tab history up to 50 snapshots, including calculation status and script-step payloads.【F:src/components/Flow.tsx†L32-L60】【F:src/contexts/UndoRedoContext.tsx†L72-L149】
- **`SnapshotProvider`** – exposes the snapshot scheduler so hooks and components can queue history saves without needing the full undo context.【F:src/components/Flow.tsx†L64-L79】
- **`FlowActionsProvider`** – supplies high-level actions (`groupWithUndo`, `ungroupWithUndo`) to any descendant component that needs to trigger grouping with undo support.【F:src/components/Flow.tsx†L61-L63】
- The exported `Flow` component adds the `ReactFlowProvider` on the outside so hooks can call `useReactFlow` anywhere within the tree.【F:src/components/Flow.tsx†L1588-L1598】

Inside those providers, `FlowContent` orchestrates:

- Tab lifecycle, loading, and tooltips via `useTabs` with persisted transforms and script-step hydration.【F:src/components/Flow.tsx†L380-L520】
- Panel state (`showUndoRedoPanel`, `showErrorPanel`, `showSearchPanel`) with auto-close logic driven by `usePanelAutoClose`.
- Calculation status per tab and error badges stored in `calcStateByTab`.
- Dialog visibility (connect dialog, share dialog + Turnstile soft gate, confirmation prompts).
- Minimap sizing and placement, including adjustments when right-hand panels are open.
- The first-run experience is gated by `FirstRunDialog`, which offers quick links to example flows and records a local-storage flag so returning users skip the modal.【F:src/components/Flow.tsx†L1535-L1560】

## Canvas & Panel Layering

`Flow.tsx` renders three compositional shells that divide responsibilities:

- **`FlowCanvas`** – wraps `<ReactFlow>` and the minimap. It receives the node/edge collections plus handlers from `useNodeOperations`, keeps track of selection mode, and exposes props that align with the hooks described below.
- **`FlowPanels`** – houses the undo history, error panel, and search panel. Visibility is controlled by props from `FlowContent`, while `usePanelAutoClose` closes panels when the active tab changes or errors clear.
- **`FlowDialogLayer`** – manages all dialogs: confirmation modal, connect dialog, share dialog, and the Turnstile soft-gate overlay. Each dialog is wired to callbacks from the flow hooks (`useFlowInteractions`, `useShareFlow`, `useSimplifiedSave`).【F:src/components/Flow.tsx†L512-L560】

## Core Hooks

### `useNodeOperations`
Centralises all mutations to the React Flow graph:

- Owns `nodes`/`edges` state and registers handlers for `onNodesChange`, `onEdgesChange`, drag/drop, grouping, and template placement (via `placeFlowDataAtPosition`).【F:src/hooks/useNodeOperations.ts†L1-L200】
- Tracks `pendingIds` for initial dimension measurements and resizes groups with `fitGroupToChildren`.
- Integrates with script-step caching to ingest saved debug steps on load and remove them when nodes are deleted.

### `useFlowInteractions`
Builds on `useNodeOperations` to coordinate undo-friendly updates:

- Coalesces drag updates and throttles snapshot pushes (`fpsForCount`, `scheduleDoubleRAF`).
- Manages dirty state flags, reconnect operations, paste shortcuts, and tab tooltips.
- Works alongside the snapshot scheduler to skip redundant history entries when batch operations occur.【F:src/hooks/useFlowInteractions.ts†L1-L220】

### `useGlobalCalculationLogic`
Handles debounced backend recalculation:

- Detects dirty calculable nodes, filters those that have sufficient inputs, and requests partial recalculation from the backend.
- Clears dirty flags for nodes that are missing required handles, drops stale script debug steps, and merges backend results/errors into the graph.
- Maintains optimistic concurrency by tagging requests with versions and discarding stale responses.【F:src/hooks/useCalculation.ts†L1-L200】

### `useSnapshotScheduler`
Coordinates snapshot timing with undo/redo:

- Provides imperative helpers (`scheduleSnapshot`, `markPendingAfterDirtyChange`, skip locks) so hooks avoid redundant history entries.
- Supports auto-snapshotting after calculations finish (when `calcStatus` returns to `OK`), and refreshes the banner when requested.
- Works in tandem with `UndoRedoContext` by pushing sanitized node/edge copies and preserving calculation state snapshots.【F:src/hooks/useSnapshotScheduler.ts†L1-L200】

### Other Supporting Hooks

- `useSimplifiedSave` – prompts users when a partial selection is active, ensuring simplified exports only capture intended nodes.【F:src/hooks/useSimplifiedSave.ts†L9-L44】
- `useSharedFlowLoader` – imports flows from the share service, merges them into the current tab, and schedules snapshots.
- `usePanelAutoClose` – closes panels when switching tabs or when error counts drop to zero.
- `useHighlight` / `useSearchHighlights` – manage search highlighting, selection syncing, and viewport fitting for highlighted nodes.
- `useColorPalette`, `useMiniMapSize`, `useFlowHotkeys`, `useTabs` – provide focused behaviour for color styling, minimap sizing, keyboard shortcuts, and multi-tab persistence respectively.

## Tab, History, and Script-Step Management

- Tabs persist to `localStorage` (`rawbit.flow.tabs`, `rawbit.flow.activeTab`) and store node/edge snapshots plus optional transform metadata.【F:src/hooks/useTabs.ts†L1-L200】
- Undo history stores script steps alongside graph snapshots so replays maintain debug traces; on restoration the cache is repopulated via `restoreScriptSteps`.【F:src/contexts/UndoRedoContext.tsx†L72-L154】
- The graph revision counter (`graphRevRef`) increments on every clean snapshot to coordinate with calculations and avoid stale banner states.

## Data Flow Overview

1. User interaction triggers a handler in `useNodeOperations` or `useFlowInteractions`.
2. Handlers mark nodes dirty, schedule snapshots, and update panel/dialog state.
3. `useGlobalCalculationLogic` debounces dirty nodes, builds a subgraph, and calls the backend.
4. Responses merge back into the graph, clearing dirty flags and pushing updates through `useSnapshotScheduler`.
5. `UndoRedoProvider` records the clean snapshot once snapshots are flushed, including script debug steps and calc status.

This separation keeps the editor predictable: mutations go through a single hook, calculations are isolated, and history is managed in one place. Extend these entry points when adding new capabilities (e.g., additional dialogs or grouping behaviours) so future contributors inherit consistent patterns.
