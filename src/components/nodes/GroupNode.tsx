//  src/components/nodes/GroupNode.tsx
//  -------------------------------------------------------------------
//  Group node with title bar, font +/- and a compact "…" menu
//  - Menu renders in a portal (always above children)
//  - Menu position follows the anchor live while open (handles zoom/pan)
//  - Deleting from the menu recursively deletes all descendants
//  -------------------------------------------------------------------

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  NodeProps,
  NodeResizer,
  useReactFlow,
  ResizeParams,
  Viewport,
} from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Minus,
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Ungroup,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClipboardLite } from "@/hooks/nodes/useClipboardLite";
import { useSnapshotSchedulerContext } from "@/hooks/useSnapshotSchedulerContext";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useFlowActions } from "@/hooks/useFlowActions";
import type { CalculationNodeData, FlowNode } from "@/types";
import { produce, setAutoFreeze } from "immer";
import { EditableLabel } from "./common/EditableLabel";
import { BorderDragHandles } from "./common/BorderDragHandles";
import { useNodePortalMenu } from "@/hooks/nodes/useNodePortalMenu";

setAutoFreeze(false);

// --- UI constants ---------------------------------------------------
const MIN_HEADER_H = 36;
const HEADER_VERTICAL_PADDING = 8;
const DEFAULT_FONT_SIZE = 20;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 72;
const RESIZE_HANDLE_SIZE = 24;

const MIN_W = 380;
const MIN_H = 220;

const BORDER_WIDTH = 10;
const FILL_OPACITY = 0.1;
const MENU_WIDTH = 200;

const normalizeFontSize = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_FONT_SIZE;
  return Math.min(Math.max(numeric, MIN_FONT_SIZE), MAX_FONT_SIZE);
};

/* --------------------------------------------------------------------
   The actual node component
-------------------------------------------------------------------- */
export default function ShadcnGroupNode({
  id,
  data,
  selected,
}: NodeProps<FlowNode>) {
  const rf = useReactFlow<FlowNode>();
  const { pushState } = useUndoRedo();
  const { lockEdgeSnapshotSkip, releaseEdgeSnapshotSkip, scheduleSnapshot } =
    useSnapshotSchedulerContext();
  const { ungroupWithUndo } = useFlowActions();

  // menu state
  const [showMenu, setShowMenu] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const { containerRef: menuContainerRef, position: menuPos } =
    useNodePortalMenu({
      isOpen: showMenu,
      anchorRef: menuAnchorRef as React.MutableRefObject<HTMLElement | null>,
      onClose: () => setShowMenu(false),
    });
  const rawTitle = data.title || "Group Node";
  const { copyId, idCopied } = useClipboardLite({
    result: undefined,
    rawTitle,
    id,
  });

  const menuPosition = useMemo(() => {
    if (!showMenu) return null;
    const anchorRect = menuAnchorRef.current?.getBoundingClientRect();
    const fallbackTop = menuPos.y - 24;
    const fallbackLeft = menuPos.x + 8;
    let top = anchorRect ? anchorRect.top : fallbackTop;
    let left = anchorRect ? anchorRect.right + 8 : fallbackLeft;

    if (typeof window !== "undefined") {
      const maxLeft = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
      left = Math.min(Math.max(8, left), maxLeft);
    } else {
      left = Math.max(8, left);
    }

    top = Math.max(8, top);

    return { top, left };
  }, [menuPos, showMenu]);

  useEffect(() => {
    if (!showMenu) return;
    const pane = document.querySelector(".react-flow__pane");
    if (!pane) return;
    const handlePanePointerDown = () => setShowMenu(false);
    pane.addEventListener("pointerdown", handlePanePointerDown);
    return () => {
      pane.removeEventListener("pointerdown", handlePanePointerDown);
    };
  }, [showMenu]);

  /* ----------------------------------------------------------------
       Helper: mutate node data in place (keeps RF internals intact)
  ---------------------------------------------------------------- */
  const mutateNode = useCallback(
    (mutator: (data: CalculationNodeData) => void) => {
      rf.setNodes((nodes) =>
        produce(nodes, (draft) => {
          const target = draft.find((node) => node.id === id);
          if (!target) return;
          const baseData: CalculationNodeData = {
            ...(target.data as CalculationNodeData | undefined),
          };
          mutator(baseData);
          target.data = baseData;
        })
      );
    },
    [rf, id]
  );

  /* ----------------------------------------------------------------
       Title / font size handlers
  ---------------------------------------------------------------- */
  const commitTitle = (val: string) => {
    mutateNode((d) => (d.title = val));
    setTimeout(
      () => pushState(rf.getNodes(), rf.getEdges(), "Change Group Title"),
      0
    );
  };

  const increaseFontSize = () => {
    const currentSize = normalizeFontSize(data.fontSize);
    if (currentSize < MAX_FONT_SIZE) {
      const step = currentSize >= 48 ? 8 : currentSize >= 32 ? 4 : 2;
      mutateNode(
        (d) => {
          d.fontSize = Math.min(currentSize + step, MAX_FONT_SIZE);
        }
      );
      setTimeout(
        () => pushState(rf.getNodes(), rf.getEdges(), "Increase Font Size"),
        0
      );
    }
  };

  const decreaseFontSize = () => {
    const currentSize = normalizeFontSize(data.fontSize);
    if (currentSize > MIN_FONT_SIZE) {
      const step = currentSize > 48 ? 8 : currentSize > 32 ? 4 : 2;
      mutateNode(
        (d) => {
          d.fontSize = Math.max(currentSize - step, MIN_FONT_SIZE);
        }
      );
      setTimeout(
        () => pushState(rf.getNodes(), rf.getEdges(), "Decrease Font Size"),
        0
      );
    }
  };

  /* ----------------------------------------------------------------
       Resize handlers
  ---------------------------------------------------------------- */
  const resize = (_evt: unknown, { x, y, width, height }: ResizeParams) => {
    rf.setNodes((nodes) =>
      produce(nodes, (draft) => {
        const node = draft.find((item) => item.id === id);
        if (!node) return;

        const data: CalculationNodeData = {
          ...(node.data as CalculationNodeData | undefined),
        };

        if (typeof width === "number") {
          node.width = width;
          data.width = width;
        }
        if (typeof height === "number") {
          node.height = height;
          data.height = height;
        }

        if (typeof x === "number") {
          node.position.x = x;
        }
        if (typeof y === "number") {
          node.position.y = y;
        }

        node.data = data;
      })
    );
  };

  const endResize = () =>
    setTimeout(
      () => pushState(rf.getNodes(), rf.getEdges(), "Resize Group"),
      0
    );

  /* ----------------------------------------------------------------
       Body interactions – pan canvas with LMB, respect selection mode
  ---------------------------------------------------------------- */
  const bodyPanRef = useRef<{
    startX: number;
    startY: number;
    origin: Viewport;
  } | null>(null);

  const isInteractionTargetEditable = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest(
        "input, textarea, [contenteditable='true'], select, button"
      )
    );
  };

  const isSelectionModeActive = () =>
    typeof document !== "undefined" &&
    document.body.dataset.flowSelectionMode === "true";

  const handleBodyPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (isInteractionTargetEditable(e.target)) return;

      if (isSelectionModeActive()) {
        // Let the pane create a marquee selection
        e.stopPropagation();
        const pane = document.querySelector(".react-flow__pane");
        if (pane) {
          pane.dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              cancelable: true,
              pointerType: e.pointerType,
              pointerId: e.pointerId,
              clientX: e.clientX,
              clientY: e.clientY,
              button: 0,
              buttons: 1,
            })
          );
        }
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      bodyPanRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origin: rf.getViewport(),
      };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [rf]
  );

  const handleBodyPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!bodyPanRef.current) return;
      e.preventDefault();
      const { startX, startY, origin } = bodyPanRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const zoom = origin.zoom ?? 1;
      rf.setViewport({
        x: (origin.x ?? 0) + dx,
        y: (origin.y ?? 0) + dy,
        zoom,
      });
    },
    [rf]
  );

  const resetBodyPan = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (!bodyPanRef.current) return;
    bodyPanRef.current = null;
    if (e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch (err) {
        void err;
      }
      e.stopPropagation();
    }
  }, []);

  /* ----------------------------------------------------------------
       Menu actions handled by useNodePortalMenu
  ---------------------------------------------------------------- */
  const handleCopyId = useCallback(() => {
    copyId();
    setShowMenu(false);
  }, [copyId]);

  const deleteGroup = useCallback(() => {
    setShowMenu(false);
    // Recursively collect ids of the group and all its descendants
    const all = rf.getNodes() as FlowNode[];
    const toRemove = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of all) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id);
          changed = true;
        }
      }
    }

    rf.setNodes((nds) => nds.filter((n) => !toRemove.has(n.id)));

    lockEdgeSnapshotSkip();
    let removedEdge = false;
    rf.setEdges((eds) => {
      if (!eds.length) {
        releaseEdgeSnapshotSkip();
        return eds;
      }
      const filtered = eds.filter((edge) => {
        const shouldRemove =
          toRemove.has(edge.source) || toRemove.has(edge.target);
        if (shouldRemove) removedEdge = true;
        return !shouldRemove;
      });
      if (!removedEdge) {
        releaseEdgeSnapshotSkip();
      }
      return filtered;
    });

    scheduleSnapshot("Node(s) removed", { refresh: true });
  }, [id, lockEdgeSnapshotSkip, releaseEdgeSnapshotSkip, rf, scheduleSnapshot]);

  const ungroupGroup = useCallback(() => {
    setShowMenu(false);

    rf.setNodes((nodes) =>
      nodes.map((node) => (node.id === id ? { ...node, selected: true } : node))
    );

    // Defer to ensure selection state is applied before invoking undo-aware action
    requestAnimationFrame(() => {
      ungroupWithUndo();
    });
  }, [id, rf, ungroupWithUndo]);

  /* -------------------------------------------------------------
     Derived layout values
  ------------------------------------------------------------- */
  const w = Number(data.width) || 600;
  const h = Number(data.height) || 360;
  const currentFontSize = normalizeFontSize(data.fontSize);
  const headerHeight = Math.max(
    MIN_HEADER_H,
    Math.round(currentFontSize + HEADER_VERTICAL_PADDING * 2)
  );
  const bodyHeight = Math.max(0, h - headerHeight);

  const borderStyle = data.borderColor
    ? { borderColor: data.borderColor }
    : undefined;

  const headerClasses =
    "border-b border-border p-2 pl-3 pr-1 flex items-center gap-2 w-full cursor-grab active:cursor-grabbing";

  return (
    <Card
      className={cn(
        "rounded-lg shadow-md bg-card relative overflow-visible font-mono text-primary",
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : ""
      )}
      style={{ width: w, height: h, ...borderStyle }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_W}
        minHeight={MIN_H}
        lineStyle={{
          border: "1px dashed var(--muted-foreground)",
          pointerEvents: "none",
          zIndex: 6,
        }}
        handleStyle={{
          width: RESIZE_HANDLE_SIZE,
          height: RESIZE_HANDLE_SIZE,
          backgroundColor: "hsl(var(--background))",
          border: "2px solid var(--resizer-handle-color)",
          borderRadius: 6,
          boxShadow: "0 0 0 2px hsl(var(--background))",
          zIndex: 8,
          pointerEvents: "auto",
        }}
        onResize={resize}
        onResizeEnd={endResize}
      />

      {/* Title bar (drag handle) */}
      <div
        data-drag-handle
        data-testid="group-header"
        className={headerClasses}
        style={{ height: headerHeight }}
      >
        <div className="leading-tight whitespace-normal break-words flex-1 min-w-0">
          <EditableLabel
            value={rawTitle}
            onCommit={commitTitle}
            maxLength={100}
            fontSize={currentFontSize}
            className="font-mono text-primary"
          />
        </div>

        {/* Error icon (if present) */}
        {data.error && (
          <div
            className="cursor-default"
            title={data.extendedError || "Group node error"}
          >
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        )}

        {/* Font size controls */}
        <Button
          variant="ghost"
          size="icon"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={decreaseFontSize}
          disabled={currentFontSize <= MIN_FONT_SIZE}
          title="Decrease font size"
          aria-label="Decrease font size"
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={increaseFontSize}
          disabled={currentFontSize >= MAX_FONT_SIZE}
          title="Increase font size"
          aria-label="Increase font size"
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4 text-foreground" />
        </Button>

        {/* More menu toggle (STOP events so we don't drag the group) */}
        <Button
          ref={menuAnchorRef}
          variant="ghost"
          size="icon"
          className="h-8 w-8 nodrag"
          onClick={() => setShowMenu((v) => !v)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          aria-label="More"
          title="More"
        >
          <MoreHorizontal className="h-4 w-4 text-foreground" />
        </Button>
      </div>

      {/* Thin 10px invisible border areas act as additional drag handles */}
      <BorderDragHandles
        borderWidth={BORDER_WIDTH}
        cornerGap={Math.max(headerHeight, RESIZE_HANDLE_SIZE)}
      />

      {/* Body content background fill (transparent) */}
      <CardContent
        data-testid="group-body"
        className="p-2 overflow-visible relative nodrag"
        style={{ height: bodyHeight }}
        onPointerDownCapture={handleBodyPointerDown}
        onPointerMoveCapture={handleBodyPointerMove}
        onPointerUpCapture={resetBodyPan}
        onPointerCancelCapture={resetBodyPan}
        onPointerLeave={resetBodyPan}
        onClickCapture={(e) => {
          if (e.button === 0) e.stopPropagation();
        }}
      >
        <div className="relative z-10 h-full w-full" data-testid="group-body-content" />
        {data.borderColor && (
          <div
            className="absolute inset-0 pointer-events-none rounded-b-lg z-0"
            data-testid="group-fill"
            style={{ backgroundColor: data.borderColor, opacity: FILL_OPACITY }}
          />
        )}
      </CardContent>

      {/* PORTALED MENU – follows the anchor live while open */}
      {showMenu &&
        menuPosition &&
        createPortal(
          <div
            ref={(node) => {
              menuContainerRef.current = node;
            }}
            className="z-[2147483647] fixed rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              minWidth: MENU_WIDTH,
            }}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={handleCopyId}
            >
              {idCopied ? (
                <>
                  <Check className="h-4 w-4" /> Copied ✓
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy ID
                </>
              )}
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={ungroupGroup}
            >
              <Ungroup className="h-4 w-4" /> Ungroup
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
              onClick={deleteGroup}
            >
              <Trash2 className="h-4 w-4" /> Delete Node
            </button>
          </div>,
          document.body
        )}
    </Card>
  );
}
