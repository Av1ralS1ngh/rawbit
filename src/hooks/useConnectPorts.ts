import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addEdge, type Connection, type Edge } from "@xyflow/react";
import type { FlowNode } from "@/types";
import type { NodePorts } from "@/components/dialog/ConnectDialog";
import { buildPorts } from "@/lib/nodes/ports";

interface UseConnectPortsArgs {
  nodes: FlowNode[];
  edges: Edge[];
  connectOpen: boolean;
  selectedSignature: string;
  selectedNodeIds: string[];
  isSwapped: boolean;
}

interface UseConnectPortsResult {
  allPorts: NodePorts[];
  sourcePorts: NodePorts | null;
  targetPorts: NodePorts | null;
  existingEdges: {
    source: string;
    sourceHandle: string | null;
    target: string;
    targetHandle: string | null;
  }[];
}

export function useConnectPorts({
  nodes,
  edges,
  connectOpen,
  selectedSignature,
  selectedNodeIds,
  isSwapped,
}: UseConnectPortsArgs): UseConnectPortsResult {
  const portCacheRef = useRef<Map<string, NodePorts>>(new Map());

  useEffect(() => {
    if (!connectOpen) return;

    const next = new Map(portCacheRef.current);
    const ids = selectedSignature
      ? selectedSignature.split("|").filter(Boolean)
      : [];
    const toCompute = ids.length === 2 ? ids : nodes.map((node) => node.id);

    toCompute.forEach((id) => {
      const target = nodes.find((n) => n.id === id);
      if (target) {
        next.set(id, buildPorts(target));
      }
    });

    portCacheRef.current = next;
  }, [connectOpen, selectedSignature, nodes]);

  const allPorts = useMemo(() => {
    if (!connectOpen) return [];
    const cache = portCacheRef.current;
    const ids = selectedSignature
      ? selectedSignature.split("|").filter(Boolean)
      : [];
    if (ids.length === 2) {
      const ordered: NodePorts[] = [];
      ids.forEach((id) => {
        const cached = cache.get(id);
        if (cached) ordered.push(cached);
      });
      return ordered;
    }
    return nodes.map((node) => cache.get(node.id) ?? buildPorts(node));
  }, [connectOpen, selectedSignature, nodes]);

  const existingEdges = useMemo(() => {
    if (!connectOpen) return [];
    return edges.map((e) => ({
      source: e.source,
      sourceHandle: e.sourceHandle ?? null,
      target: e.target,
      targetHandle: e.targetHandle ?? null,
    }));
  }, [connectOpen, edges]);

  const { sourcePorts, targetPorts } = useMemo(() => {
    if (selectedNodeIds.length !== 2) {
      return { sourcePorts: null, targetPorts: null };
    }

    const [primaryId, secondaryId] = isSwapped
      ? [selectedNodeIds[1], selectedNodeIds[0]]
      : [selectedNodeIds[0], selectedNodeIds[1]];

    const cache = portCacheRef.current;
    let primary = cache.get(primaryId);
    if (!primary) {
      const node = nodes.find((n) => n.id === primaryId);
      if (node) {
        primary = buildPorts(node);
        cache.set(primaryId, primary);
      }
    }

    let secondary = cache.get(secondaryId);
    if (!secondary) {
      const node = nodes.find((n) => n.id === secondaryId);
      if (node) {
        secondary = buildPorts(node);
        cache.set(secondaryId, secondary);
      }
    }

    return {
      sourcePorts: primary ?? null,
      targetPorts: secondary ?? null,
    };
  }, [isSwapped, nodes, selectedNodeIds]);

  return { allPorts, sourcePorts, targetPorts, existingEdges };
}

interface UseConnectDialogArgs {
  nodes: FlowNode[];
  edges: Edge[];
  connectOpen: boolean;
  selectedNodeIds: string[];
  setNodes: (updater: (nodes: FlowNode[]) => FlowNode[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  markPendingAfterDirtyChange: () => void;
  skipNextEdgeSnapshotRef: React.MutableRefObject<boolean>;
  setConnectOpen: (open: boolean) => void;
}

export function useConnectDialog({
  nodes,
  edges,
  connectOpen,
  selectedNodeIds,
  setNodes,
  setEdges,
  markPendingAfterDirtyChange,
  skipNextEdgeSnapshotRef,
  setConnectOpen,
}: UseConnectDialogArgs) {
  const [isSwapped, setIsSwapped] = useState(false);

  const selectedSignature = useMemo(() => {
    if (selectedNodeIds.length === 0) return "";
    const sorted = [...selectedNodeIds].sort();
    return sorted.join("|");
  }, [selectedNodeIds]);

  const portData = useConnectPorts({
    nodes,
    edges,
    connectOpen,
    selectedSignature,
    selectedNodeIds,
    isSwapped,
  });

  const handleApply = useCallback(
    (
      edgesToAdd: {
        source: string;
        sourceHandle: string | null;
        target: string;
        targetHandle: string | null;
      }[]
    ) => {
      if (edgesToAdd.length === 0) {
        setIsSwapped((prev) => !prev);
        return;
      }

      setEdges((previous) =>
        edgesToAdd.reduce(
          (acc, edge) =>
            addEdge(
              {
                ...edge,
                targetHandle: edge.targetHandle ?? undefined,
              } as Connection,
              acc
            ),
          previous
        )
      );

      setNodes((previous) =>
        previous.map((node) =>
          edgesToAdd.some((edge) => edge.target === node.id)
            ? { ...node, data: { ...node.data, dirty: true } }
            : node
        )
      );

      skipNextEdgeSnapshotRef.current = true;
      markPendingAfterDirtyChange();
      setConnectOpen(false);
    },
    [
      markPendingAfterDirtyChange,
      setConnectOpen,
      setEdges,
      setNodes,
      skipNextEdgeSnapshotRef,
    ]
  );

  return {
    ...portData,
    handleApply,
  } as const;
}
