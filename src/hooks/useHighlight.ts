import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore, type ReactFlowInstance } from "@xyflow/react";
import type { FlowNode } from "@/types";

interface UseHighlightArgs {
  setNodes: (updater: (nodes: FlowNode[]) => FlowNode[]) => void;
  baseSetNodes: (updater: (nodes: FlowNode[]) => FlowNode[]) => void;
  getNodes: () => FlowNode[];
  getFlowInstance: () => ReactFlowInstance | null;
  hasNodeSelectionRef: React.MutableRefObject<boolean>;
}

export interface HighlightState {
  highlightedNodes: Set<string>;
  isSearchHighlight: boolean;
}

export interface HighlightActions {
  highlightAndFit: (ids: string[]) => void;
  setHighlightedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setIsSearchHighlight: React.Dispatch<React.SetStateAction<boolean>>;
  clearHighlights: () => void;
}

export function updateHighlightSelection(
  nodes: FlowNode[],
  ids: Set<string>
): FlowNode[] {
  return nodes.map((n) => {
    const shouldHighlight = ids.has(n.id);
    const shouldSelect = shouldHighlight;
    const isHighlighted = n.data?.isHighlighted ?? false;
    if (n.selected === shouldSelect && isHighlighted === shouldHighlight) {
      return n;
    }
    return {
      ...n,
      selected: shouldSelect,
      data: { ...n.data, isHighlighted: shouldHighlight },
    };
  });
}

export function syncHighlightClasses(
  nodes: FlowNode[],
  next: Set<string>,
  changed: Set<string>
): FlowNode[] {
  return nodes.map((n) => {
    if (!changed.has(n.id)) return n;
    const shouldHighlight = next.has(n.id);
    const cls = n.className ?? "";
    const has = /\bis-highlighted\b/.test(cls);

    const nextClass = shouldHighlight
      ? has
        ? cls
        : [cls, "is-highlighted"].filter(Boolean).join(" ")
      : cls.replace(/\bis-highlighted\b/g, "").trim() || undefined;

    if ((n.data?.isHighlighted ?? false) === shouldHighlight && nextClass === n.className) {
      return n;
    }

    return {
      ...n,
      className: nextClass,
      data: { ...n.data, isHighlighted: shouldHighlight },
    };
  });
}

export function useHighlight({
  setNodes,
  baseSetNodes,
  getNodes,
  getFlowInstance,
  hasNodeSelectionRef,
}: UseHighlightArgs): [HighlightState, HighlightActions] {
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [isSearchHighlight, setIsSearchHighlight] = useState(false);
  const prevHighlightedRef = useRef<Set<string>>(new Set());

  const clearHighlights = useCallback(() => {
    setHighlightedNodes(new Set());
    setIsSearchHighlight(false);
  }, []);

  const highlightSig = useMemo(() => {
    const ids: string[] = [];
    highlightedNodes.forEach((id) => ids.push(id));
    ids.sort();
    return ids.join("|");
  }, [highlightedNodes]);

  useEffect(() => {
    const prev = prevHighlightedRef.current;
    const next = highlightedNodes;

    const changed = new Set<string>();
    next.forEach((id) => {
      if (!prev.has(id)) changed.add(id);
    });
    prev.forEach((id) => {
      if (!next.has(id)) changed.add(id);
    });

    if (!changed.size) return;

    baseSetNodes((nds) => syncHighlightClasses(nds, next, changed));

    prevHighlightedRef.current = new Set(next);
  }, [baseSetNodes, highlightSig, highlightedNodes]);

  const highlightAndFit = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);

      startTransition(() => {
        setIsSearchHighlight(idSet.size > 0);
        setNodes((nds) => updateHighlightSelection(nds, idSet));
        setHighlightedNodes(new Set(idSet));
      });

      if (idSet.size === 0) return;

      const instance = getFlowInstance();
      if (!instance) return;

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const toFit = getNodes().filter((n) => idSet.has(n.id));
          if (toFit.length) {
            instance.fitView({
              nodes: toFit,
              padding: 0.2,
              duration: 350,
              maxZoom: 2,
            });
          }
        })
      );
    },
    [getFlowInstance, getNodes, setNodes]
  );

  const selectedEdgeEndpoints = useStore(
    useCallback(
      (state) =>
        state.edges
          .filter((edge) => edge.selected)
          .map((edge) => [edge.source, edge.target] as const),
      []
    ),
    (a, b) =>
      a.length === b.length &&
      a.every((pair, idx) => pair[0] === b[idx][0] && pair[1] === b[idx][1])
  );

  useEffect(() => {
    if (isSearchHighlight) return;

    if (hasNodeSelectionRef.current) {
      clearHighlights();
      return;
    }

    if (!selectedEdgeEndpoints.length) {
      clearHighlights();
      return;
    }

    const ids = new Set<string>();
    selectedEdgeEndpoints.forEach(([source, target]) => {
      ids.add(source);
      ids.add(target);
    });
    setHighlightedNodes(ids);
  }, [
    selectedEdgeEndpoints,
    isSearchHighlight,
    hasNodeSelectionRef,
    clearHighlights,
  ]);

  return [
    { highlightedNodes, isSearchHighlight },
    {
      highlightAndFit,
      setHighlightedNodes,
      setIsSearchHighlight,
      clearHighlights,
    },
  ];
}
