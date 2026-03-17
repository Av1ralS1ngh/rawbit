import type { Edge } from "@xyflow/react";
import type { FlowNode, NodeData } from "@/types";
import type { DiagramSection } from "@/lib/protocolDiagram/types";

export interface GroupCompressionArgs {
  groupId: string;
  groupTitle: string;
  nodes: FlowNode[];
  edges: Edge[];
}

interface GroupCompressionResult {
  shouldCompress: boolean;
  sections: DiagramSection[];
}

type FunctionFamily =
  | "tx_inputs"
  | "hash_pipeline"
  | "preimage_assembly"
  | "final_digest"
  | "signature"
  | "misc";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const byPosition = (a: FlowNode, b: FlowNode) => {
  if (a.position.y !== b.position.y) return a.position.y - b.position.y;
  if (a.position.x !== b.position.x) return a.position.x - b.position.x;
  return a.id.localeCompare(b.id);
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const nodeText = (node: FlowNode): string => {
  const data = node.data as NodeData | undefined;
  return `${node.id} ${asString(data?.title)} ${asString(data?.functionName)} ${asString(
    data?.comment
  )}`.toLowerCase();
};

const classifyFamily = (node: FlowNode): FunctionFamily => {
  const text = nodeText(node);

  if (
    /(txid|vout|prevout|sequence|locktime|input|inputs|version|marker|flag|varint|little_endian|satoshi|amount)/i.test(
      text
    )
  ) {
    return "tx_inputs";
  }

  if (/(concat|preimage|assemble)/i.test(text)) {
    return "preimage_assembly";
  }

  if (/(tagged|digest|sighash|double_sha256|final)/i.test(text)) {
    return "final_digest";
  }

  if (/(sha256|hash)/i.test(text)) {
    return "hash_pipeline";
  }

  if (/(musig|nonce|signature|sig|pubkey|private_key|taproot)/i.test(text)) {
    return "signature";
  }

  return "misc";
};

const FAMILY_LABELS: Record<FunctionFamily, string> = {
  tx_inputs: "TX Inputs",
  hash_pipeline: "Hash Pipeline",
  preimage_assembly: "Preimage Assembly",
  final_digest: "Final Digest",
  signature: "Signature Flow",
  misc: "Computation",
};

const isSighashLike = (groupTitle: string, nodes: FlowNode[]): boolean => {
  const title = groupTitle.toLowerCase();
  if (title.includes("sighash")) return true;

  const familyCounts = new Map<FunctionFamily, number>();
  nodes.forEach((node) => {
    const family = classifyFamily(node);
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  });

  const hashCount = familyCounts.get("hash_pipeline") ?? 0;
  const preimageCount = familyCounts.get("preimage_assembly") ?? 0;
  return nodes.length >= 12 && hashCount >= 6 && preimageCount >= 2;
};

const buildSection = (
  groupId: string,
  index: number,
  title: string,
  nodeIds: string[]
): DiagramSection => ({
  id: `section:${groupId}:${index}:${title.toLowerCase().replace(/\s+/g, "_")}`,
  title,
  count: nodeIds.length,
  nodeIds,
});

const buildSighashSections = (
  groupId: string,
  nodes: FlowNode[]
): DiagramSection[] => {
  const familyBuckets = new Map<FunctionFamily, FlowNode[]>();
  nodes.forEach((node) => {
    const family = classifyFamily(node);
    const list = familyBuckets.get(family) ?? [];
    list.push(node);
    familyBuckets.set(family, list);
  });

  const assigned = new Set<string>();
  const sections: DiagramSection[] = [];
  const sectionFamilies: Array<{ title: string; families: FunctionFamily[] }> = [
    { title: "TX Inputs", families: ["tx_inputs"] },
    { title: "Hash Pipeline", families: ["hash_pipeline"] },
    { title: "Preimage Assembly", families: ["preimage_assembly"] },
    { title: "Final Digest", families: ["final_digest", "signature", "misc"] },
  ];

  sectionFamilies.forEach((entry) => {
    const nodeIds = entry.families
      .flatMap((family) => (familyBuckets.get(family) ?? []).slice().sort(byPosition))
      .map((node) => node.id)
      .filter((id) => {
        if (assigned.has(id)) return false;
        assigned.add(id);
        return true;
      });

    if (nodeIds.length === 0) return;
    sections.push(buildSection(groupId, sections.length + 1, entry.title, nodeIds));
  });

  return sections;
};

const computeNodeDepths = (nodes: FlowNode[], edges: Edge[]): Map<string, number> => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  const depth = new Map<string, number>();

  nodes.forEach((node) => {
    adjacency.set(node.id, []);
    indegree.set(node.id, 0);
    depth.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  });

  const queue = Array.from(nodeIds)
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .sort((a, b) => a.localeCompare(b));

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentDepth = depth.get(current) ?? 0;
    const outgoing = (adjacency.get(current) ?? []).slice().sort((a, b) => a.localeCompare(b));
    outgoing.forEach((next) => {
      depth.set(next, Math.max(depth.get(next) ?? 0, currentDepth + 1));
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    });
  }

  return depth;
};

const dominantFamily = (nodes: FlowNode[]): FunctionFamily => {
  const counts = new Map<FunctionFamily, number>();
  nodes.forEach((node) => {
    const family = classifyFamily(node);
    counts.set(family, (counts.get(family) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  })[0]?.[0] ?? "misc";
};

const buildDepthSections = (
  groupId: string,
  nodes: FlowNode[],
  edges: Edge[]
): DiagramSection[] => {
  const depths = computeNodeDepths(nodes, edges);
  const maxDepth = Math.max(...Array.from(depths.values()));
  const targetSectionCount = clamp(Math.ceil(nodes.length / 8), 3, 8);
  const bucketSize = Math.max(1, Math.ceil((maxDepth + 1) / targetSectionCount));

  const bucketMap = new Map<number, FlowNode[]>();
  nodes.slice().sort(byPosition).forEach((node) => {
    const depth = depths.get(node.id) ?? 0;
    const bucketIndex = Math.min(
      targetSectionCount - 1,
      Math.floor(depth / bucketSize)
    );
    const list = bucketMap.get(bucketIndex) ?? [];
    list.push(node);
    bucketMap.set(bucketIndex, list);
  });

  const sections: DiagramSection[] = [];
  Array.from(bucketMap.keys())
    .sort((a, b) => a - b)
    .forEach((bucketIndex) => {
      const bucketNodes = (bucketMap.get(bucketIndex) ?? []).slice().sort(byPosition);
      if (bucketNodes.length === 0) return;
      const family = dominantFamily(bucketNodes);
      sections.push(
        buildSection(
          groupId,
          sections.length + 1,
          FAMILY_LABELS[family],
          bucketNodes.map((node) => node.id)
        )
      );
    });

  if (sections.length === 0) {
    return [
      buildSection(
        groupId,
        1,
        "Computation",
        nodes.slice().sort(byPosition).map((node) => node.id)
      ),
    ];
  }

  return sections;
};

export function compressGroup({
  groupId,
  groupTitle,
  nodes,
  edges,
}: GroupCompressionArgs): GroupCompressionResult {
  const shouldCompress =
    nodes.length >= 18 || (nodes.length >= 10 && isSighashLike(groupTitle, nodes));

  if (!shouldCompress) {
    return {
      shouldCompress: false,
      sections: [],
    };
  }

  const sections = isSighashLike(groupTitle, nodes)
    ? buildSighashSections(groupId, nodes)
    : buildDepthSections(groupId, nodes, edges);

  return {
    shouldCompress: true,
    sections,
  };
}
