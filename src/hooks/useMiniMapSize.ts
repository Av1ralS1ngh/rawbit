import { useEffect, useState } from "react";
import type { FlowNode } from "@/types";

interface MiniMapOptions {
  longSide?: number;
  shortSideMin?: number;
  defaultHeight?: number;
}

export function useMiniMapSize(
  nodes: FlowNode[],
  showMiniMap: boolean,
  {
    longSide = 170,
    shortSideMin = 90,
    defaultHeight = 120,
  }: MiniMapOptions = {}
) {
  const [miniMapSize, setMiniMapSize] = useState<{ w: number; h: number }>(() => ({
    w: longSide,
    h: defaultHeight,
  }));

  useEffect(() => {
    if (!showMiniMap) return;

    if (!nodes || nodes.length === 0) {
      setMiniMapSize({ w: longSide, h: defaultHeight });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const measuredWidth = n.measured?.width ?? n.width ?? 150;
      const measuredHeight = n.measured?.height ?? n.height ?? 50;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + measuredWidth);
      maxY = Math.max(maxY, n.position.y + measuredHeight);
    }

    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const aspect = bw / bh;

    if (aspect >= 1) {
      const h = Math.max(shortSideMin, Math.round(longSide / aspect));
      setMiniMapSize({ w: longSide, h });
    } else {
      const w = Math.max(shortSideMin, Math.round(longSide * aspect));
      setMiniMapSize({ w, h: longSide });
    }
  }, [nodes, showMiniMap, longSide, shortSideMin, defaultHeight]);

  return miniMapSize;
}
