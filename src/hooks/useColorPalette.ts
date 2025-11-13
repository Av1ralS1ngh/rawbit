import { useCallback, useMemo, useState } from "react";
import type { FlowNode } from "@/types";
import type { XYPosition } from "@xyflow/react";

interface UseColorPaletteOptions {
  getNodes: () => FlowNode[];
  setNodes: (updater: (nodes: FlowNode[]) => FlowNode[]) => void;
  scheduleSnapshot: (label: string, options?: { refresh?: boolean }) => void;
  isSidebarOpen: boolean;
  tabsCount: number;
  isColorable: (node: FlowNode) => boolean;
}

interface ColorPaletteState {
  isOpen: boolean;
  position: XYPosition;
  canApply: boolean;
}

export function useColorPalette({
  getNodes,
  setNodes,
  scheduleSnapshot,
  isSidebarOpen,
  tabsCount,
  isColorable,
}: UseColorPaletteOptions) {
  const [state, setState] = useState<ColorPaletteState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    canApply: false,
  });

  const paletteMetrics = useMemo(
    () => ({
      width: 200,
      height: 150,
      margin: 10,
      topBarHeight: 56,
      tabBarHeight: 40,
    }),
    []
  );

  const updateEligibility = useCallback(() => {
    const hasColorableSelection = getNodes().some(
      (node) => node.selected && isColorable(node)
    );
    setState((prev) => ({ ...prev, canApply: hasColorableSelection }));
  }, [getNodes, isColorable]);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const open = useCallback(
    (evt: React.MouseEvent) => {
      setState((prev) => {
        if (!prev.canApply) {
          return prev;
        }

        const { width, height, margin, topBarHeight, tabBarHeight } =
          paletteMetrics;

        let x = evt.clientX;
        let y =
          topBarHeight +
          margin +
          (tabsCount >= 2 ? tabBarHeight : 0) +
          (isSidebarOpen ? 30 : 10);

        const vw = window.innerWidth;
        if (x + width / 2 > vw - margin) x = vw - margin - width / 2;
        if (x - width / 2 < margin) x = margin + width / 2;

        const minRequiredHeight = y + height / 2 + margin;
        if (window.innerHeight < minRequiredHeight) {
          y = window.innerHeight - height / 2 - margin;
        }

        return {
          ...prev,
          isOpen: true,
          position: { x, y },
        };
      });
    },
    [isSidebarOpen, paletteMetrics, tabsCount]
  );

  const apply = useCallback(
    (color: string | undefined) => {
      const nodes = getNodes();
      const targets = nodes.filter(
        (node) => node.selected && isColorable(node)
      );
      if (!targets.length) {
        close();
        return;
      }

      setNodes((prev) =>
        prev.map((node) =>
          targets.some((target) => target.id === node.id)
            ? { ...node, data: { ...node.data, borderColor: color } }
            : node
        )
      );

      scheduleSnapshot("Change Node Color");
      close();
      updateEligibility();
    },
    [close, getNodes, isColorable, scheduleSnapshot, setNodes, updateEligibility]
  );

  return {
    isOpen: state.isOpen,
    position: state.position,
    canApply: state.canApply,
    open,
    close,
    apply,
    updateEligibility,
  } as const;
}
