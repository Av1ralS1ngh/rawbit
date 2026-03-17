import type { Edge } from "@xyflow/react";
import type { FlowNode, NodeData } from "@/types";
import type {
  DiagramGroup,
  DiagramBundle,
  DiagramInnerEdge,
  DiagramInnerNode,
  ProtocolDiagramModel,
} from "@/lib/protocolDiagram/types";
import { detectLanes } from "@/lib/protocolDiagram/detectLanes";
import { compressGroup } from "@/lib/protocolDiagram/groupCompression";

interface BuildProtocolDiagramModelArgs {
  nodes: FlowNode[];
  edges: Edge[];
}

const DEFAULT_GROUP_WIDTH = 300;
const DEFAULT_GROUP_HEIGHT = 200;
const RESULT_PREVIEW_MAX = 120;

const byPosition = (a: { position: { x: number; y: number } }, b: { position: { x: number; y: number } }) => {
  if (a.position.y !== b.position.y) return a.position.y - b.position.y;
  if (a.position.x !== b.position.x) return a.position.x - b.position.x;
  return 0;
};

const asFiniteNumber = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const previewResult = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const raw =
    typeof value === "string" ? value : (() => {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })();
  if (!raw) return undefined;
  return raw.length <= RESULT_PREVIEW_MAX
    ? raw
    : `${raw.slice(0, RESULT_PREVIEW_MAX - 1)}…`;
};

const edgeFallbackId = (edge: Edge): string =>
  `${edge.source}:${edge.sourceHandle ?? ""}->${edge.target}:${edge.targetHandle ?? ""}`;

const groupTitle = (group: FlowNode): string => {
  const data = group.data as NodeData | undefined;
  return asString(data?.title) ?? group.id;
};

const groupComment = (group: FlowNode): string | undefined => {
  const data = group.data as NodeData | undefined;
  return asString(data?.comment);
};

const groupColor = (group: FlowNode): string | undefined => {
  const data = group.data as NodeData | undefined;
  return asString(data?.borderColor);
};

const isExcludedFromFlowMap = (group: FlowNode): boolean => {
  const data = group.data as NodeData | undefined;
  return data?.excludeFromFlowMap === true;
};

const groupSize = (group: FlowNode): { w: number; h: number } => {
  const data = group.data as NodeData | undefined;
  const width =
    asFiniteNumber(data?.width) ??
    asFiniteNumber(group.width) ??
    asFiniteNumber(group.measured?.width) ??
    DEFAULT_GROUP_WIDTH;
  const height =
    asFiniteNumber(data?.height) ??
    asFiniteNumber(group.height) ??
    asFiniteNumber(group.measured?.height) ??
    DEFAULT_GROUP_HEIGHT;
  return { w: width, h: height };
};

const isFlowMapInnerNode = (node: FlowNode): boolean =>
  node.type !== "shadcnTextInfo";

const innerNodeTitle = (node: FlowNode): string => {
  const data = node.data as NodeData | undefined;
  return asString(data?.title) ?? asString(data?.functionName) ?? node.id;
};

const toInnerNode = (node: FlowNode): DiagramInnerNode => {
  const data = node.data as NodeData | undefined;
  return {
    id: node.id,
    title: innerNodeTitle(node),
    functionName: asString(data?.functionName),
    resultPreview: previewResult(data?.result),
    localPosition: {
      x: node.position.x,
      y: node.position.y,
    },
  };
};

interface MutableBundle {
  id: string;
  sourceGroupId: string;
  targetGroupId: string;
  semanticKey: string;
  label: string;
  sensitivity: "public";
  edgeIds: string[];
  count: number;
  sourceNodeIds: Set<string>;
  targetNodeIds: Set<string>;
  pairs: Array<{ edgeId: string; sourceNodeId: string; targetNodeId: string }>;
}

export function buildProtocolDiagramModel({
  nodes,
  edges,
}: BuildProtocolDiagramModelArgs): ProtocolDiagramModel {
  const groupNodes = nodes
    .filter(
      (node) => node.type === "shadcnGroup" && !isExcludedFromFlowMap(node)
    )
    .sort((a, b) => {
      const pos = byPosition(a, b);
      if (pos !== 0) return pos;
      return a.id.localeCompare(b.id);
    });

  if (groupNodes.length === 0) {
    return {
      groups: [],
      bundles: [],
      hasGroups: false,
    };
  }

  const groupIdSet = new Set(groupNodes.map((group) => group.id));
  const childrenByGroup = new Map<string, FlowNode[]>();
  nodes.forEach((node) => {
    if (!node.parentId || !groupIdSet.has(node.parentId)) return;
    if (!isFlowMapInnerNode(node)) return;
    const list = childrenByGroup.get(node.parentId) ?? [];
    list.push(node);
    childrenByGroup.set(node.parentId, list);
  });

  const nodeToGroup = new Map<string, string>();
  groupNodes.forEach((group) => {
    nodeToGroup.set(group.id, group.id);
  });
  nodes.forEach((node) => {
    if (!node.parentId || !groupIdSet.has(node.parentId)) return;
    if (!isFlowMapInnerNode(node)) return;
    nodeToGroup.set(node.id, node.parentId);
  });

  const groups: DiagramGroup[] = groupNodes.map((group) => {
    const children = (childrenByGroup.get(group.id) ?? [])
      .slice()
      .sort((a, b) => {
        const pos = byPosition(a, b);
        if (pos !== 0) return pos;
        return a.id.localeCompare(b.id);
      });

    const laneDetection = detectLanes({ nodes: children });
    const compression = compressGroup({
      groupId: group.id,
      groupTitle: groupTitle(group),
      nodes: children,
      edges,
    });
    const laneKeyByNodeId = new Map<string, string>();
    laneDetection.lanes.forEach((lane) => {
      lane.nodeIds.forEach((nodeId) => {
        laneKeyByNodeId.set(nodeId, lane.key);
      });
    });

    const nodesWithLane: DiagramInnerNode[] = children.map((node) => ({
      ...toInnerNode(node),
      laneKey: laneKeyByNodeId.get(node.id),
    }));
    const childIdSet = new Set(children.map((child) => child.id));
    const innerEdges: DiagramInnerEdge[] = edges
      .filter(
        (edge) => childIdSet.has(edge.source) && childIdSet.has(edge.target)
      )
      .map((edge) => ({
        id: edge.id || edgeFallbackId(edge),
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
      }))
      .sort((a, b) => {
        if (a.sourceNodeId !== b.sourceNodeId) {
          return a.sourceNodeId.localeCompare(b.sourceNodeId);
        }
        if (a.targetNodeId !== b.targetNodeId) {
          return a.targetNodeId.localeCompare(b.targetNodeId);
        }
        return a.id.localeCompare(b.id);
      });

    const presentation =
      children.length <= 5
        ? "full"
        : compression.shouldCompress
          ? "compressed"
          : laneDetection.confidence >= 0.6 && laneDetection.lanes.length >= 2
            ? "lanes"
            : "full";

    return {
      id: group.id,
      title: groupTitle(group),
      comment: groupComment(group),
      color: groupColor(group),
      nodeCount: children.length,
      position: {
        x: group.position.x,
        y: group.position.y,
      },
      size: groupSize(group),
      nodes: nodesWithLane,
      edges: innerEdges,
      lanes: laneDetection.lanes,
      sections: compression.sections,
      presentation,
    };
  });

  const bundlesByKey = new Map<string, MutableBundle>();
  edges.forEach((edge) => {
    const sourceGroupId = nodeToGroup.get(edge.source);
    const targetGroupId = nodeToGroup.get(edge.target);
    if (!sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId) return;

    const key = `${sourceGroupId}->${targetGroupId}`;
    const existing = bundlesByKey.get(key);
    const edgeId = edge.id || edgeFallbackId(edge);

    if (existing) {
      existing.edgeIds.push(edgeId);
      existing.count += 1;
      existing.sourceNodeIds.add(edge.source);
      existing.targetNodeIds.add(edge.target);
      existing.pairs.push({ edgeId, sourceNodeId: edge.source, targetNodeId: edge.target });
      return;
    }

    const semanticKey = `pair:${key}`;
    bundlesByKey.set(key, {
      id: `bundle:pair:${key}`,
      sourceGroupId,
      targetGroupId,
      semanticKey,
      label: "",
      sensitivity: "public",
      edgeIds: [edgeId],
      count: 1,
      sourceNodeIds: new Set([edge.source]),
      targetNodeIds: new Set([edge.target]),
      pairs: [{ edgeId, sourceNodeId: edge.source, targetNodeId: edge.target }],
    });
  });

  const bundles: DiagramBundle[] = Array.from(bundlesByKey.values())
    .map((bundle) => {
      const sourceNodeIds = Array.from(bundle.sourceNodeIds).sort((a, b) =>
        a.localeCompare(b)
      );
      const targetNodeIds = Array.from(bundle.targetNodeIds).sort((a, b) =>
        a.localeCompare(b)
      );
      return {
        id: bundle.id,
        sourceGroupId: bundle.sourceGroupId,
        targetGroupId: bundle.targetGroupId,
        semanticKey: bundle.semanticKey,
        label: `${bundle.count} edge${bundle.count === 1 ? "" : "s"}`,
        sensitivity: bundle.sensitivity,
        edgeIds: bundle.edgeIds,
        sourceNodeIds,
        targetNodeIds,
        count: bundle.count,
        pairs: bundle.pairs,
      };
    })
    .sort((a, b) => {
      if (a.sourceGroupId !== b.sourceGroupId) {
        return a.sourceGroupId.localeCompare(b.sourceGroupId);
      }
      if (a.targetGroupId !== b.targetGroupId) {
        return a.targetGroupId.localeCompare(b.targetGroupId);
      }
      return a.id.localeCompare(b.id);
    });

  return {
    groups,
    bundles,
    hasGroups: true,
  };
}
