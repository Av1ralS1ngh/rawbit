import type { FlowNode, NodeData } from "@/types";
import type { DiagramLane } from "@/lib/protocolDiagram/types";

export interface DetectLanesArgs {
  nodes: FlowNode[];
}

export interface DetectLanesResult {
  lanes: DiagramLane[];
  confidence: number;
}

const PARTICIPANT_TOKENS = [
  "alice",
  "bob",
  "charlie",
  "dave",
  "eve",
  "coordinator",
  "aggregator",
];

const Y_CLUSTER_GAP = 80;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const byPosition = (a: FlowNode, b: FlowNode) => {
  if (a.position.y !== b.position.y) return a.position.y - b.position.y;
  if (a.position.x !== b.position.x) return a.position.x - b.position.x;
  return a.id.localeCompare(b.id);
};

const participantTitle = (key: string): string =>
  key
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getNodeText = (node: FlowNode): string => {
  const data = node.data as NodeData | undefined;
  return [
    node.id,
    asString(data?.title),
    asString(data?.functionName),
    asString(data?.comment),
  ]
    .join(" ")
    .toLowerCase();
};

const detectTokenLaneKey = (node: FlowNode): string | undefined => {
  const text = getNodeText(node);
  for (const token of PARTICIPANT_TOKENS) {
    if (new RegExp(`\\b${token}\\b`, "i").test(text)) {
      return token;
    }
  }

  const signerMatch = text.match(/\bsigner[\s_-]?(\d+)\b/i);
  if (signerMatch) return `signer_${signerMatch[1]}`;

  const partyMatch = text.match(/\bparty[\s_-]?(\d+)\b/i);
  if (partyMatch) return `party_${partyMatch[1]}`;

  return undefined;
};

const buildTokenLanes = (nodes: FlowNode[]): DetectLanesResult | null => {
  const laneMap = new Map<string, FlowNode[]>();
  nodes.forEach((node) => {
    const laneKey = detectTokenLaneKey(node);
    if (!laneKey) return;
    const current = laneMap.get(laneKey) ?? [];
    current.push(node);
    laneMap.set(laneKey, current);
  });

  if (laneMap.size < 2) return null;

  const laneOrder = Array.from(laneMap.keys()).sort((a, b) => {
    const aNodes = laneMap.get(a) ?? [];
    const bNodes = laneMap.get(b) ?? [];
    const ay =
      aNodes.reduce((acc, node) => acc + node.position.y, 0) /
      Math.max(1, aNodes.length);
    const by =
      bNodes.reduce((acc, node) => acc + node.position.y, 0) /
      Math.max(1, bNodes.length);
    if (ay !== by) return ay - by;
    return a.localeCompare(b);
  });

  const lanes: DiagramLane[] = laneOrder.map((key) => {
    const laneNodes = (laneMap.get(key) ?? []).slice().sort(byPosition);
    const laneConfidence = laneNodes.length > 1 ? 0.95 : 0.8;
    return {
      key,
      title: participantTitle(key),
      nodeIds: laneNodes.map((node) => node.id),
      confidence: laneConfidence,
    };
  });

  const confidence =
    lanes.reduce((acc, lane) => acc + lane.confidence, 0) / lanes.length;
  return {
    lanes,
    confidence,
  };
};

const buildYClusterLanes = (nodes: FlowNode[]): DetectLanesResult | null => {
  if (nodes.length < 6) return null;
  const sorted = nodes.slice().sort(byPosition);

  const clusters: FlowNode[][] = [];
  let current: FlowNode[] = [];
  let lastY: number | null = null;
  sorted.forEach((node) => {
    if (lastY === null || Math.abs(node.position.y - lastY) <= Y_CLUSTER_GAP) {
      current.push(node);
      lastY = node.position.y;
      return;
    }

    clusters.push(current);
    current = [node];
    lastY = node.position.y;
  });
  if (current.length > 0) clusters.push(current);

  if (clusters.length < 2 || clusters.length > 5) return null;
  if (clusters.some((cluster) => cluster.length < 2)) return null;

  const lanes: DiagramLane[] = clusters.map((cluster, index) => ({
    key: `row_${index + 1}`,
    title: `Row ${index + 1}`,
    nodeIds: cluster.map((node) => node.id),
    confidence: 0.6,
  }));

  return {
    lanes,
    confidence: 0.6,
  };
};

export function detectLanes({ nodes }: DetectLanesArgs): DetectLanesResult {
  const tokenLanes = buildTokenLanes(nodes);
  if (tokenLanes) return tokenLanes;

  const yClusterLanes = buildYClusterLanes(nodes);
  if (yClusterLanes) return yClusterLanes;

  return {
    lanes: [],
    confidence: 0,
  };
}
