import type {
  FlowNode,
  ProtocolDiagramGroupOffsets,
  ProtocolDiagramLayout,
} from "@/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function collectGroupNodeIds(nodes: readonly Pick<FlowNode, "id" | "type">[]): Set<string> {
  return new Set(
    nodes.filter((node) => node.type === "shadcnGroup").map((node) => node.id)
  );
}

export function sanitizeProtocolDiagramLayout(
  value: unknown,
  validGroupIds?: ReadonlySet<string>
): ProtocolDiagramLayout | undefined {
  if (!isRecord(value)) return undefined;
  const rawOffsets = value.groupOffsets;
  if (!isRecord(rawOffsets)) return undefined;

  const groupOffsets: ProtocolDiagramGroupOffsets = {};
  for (const [groupId, maybeOffset] of Object.entries(rawOffsets)) {
    if (validGroupIds && !validGroupIds.has(groupId)) continue;
    if (!isRecord(maybeOffset)) continue;
    if (!isFiniteNumber(maybeOffset.dx) || !isFiniteNumber(maybeOffset.dy)) {
      continue;
    }
    groupOffsets[groupId] = {
      dx: maybeOffset.dx,
      dy: maybeOffset.dy,
    };
  }

  if (Object.keys(groupOffsets).length === 0) return undefined;
  return { groupOffsets };
}

export function remapProtocolDiagramLayout(
  layout: ProtocolDiagramLayout | undefined,
  idMap: ReadonlyMap<string, string>,
  validGroupIds?: ReadonlySet<string>
): ProtocolDiagramLayout | undefined {
  if (!layout?.groupOffsets) return undefined;

  const remapped: ProtocolDiagramGroupOffsets = {};
  for (const [groupId, offset] of Object.entries(layout.groupOffsets)) {
    const mappedGroupId = idMap.get(groupId) ?? groupId;
    if (validGroupIds && !validGroupIds.has(mappedGroupId)) continue;
    if (!isFiniteNumber(offset.dx) || !isFiniteNumber(offset.dy)) continue;
    remapped[mappedGroupId] = {
      dx: offset.dx,
      dy: offset.dy,
    };
  }

  if (Object.keys(remapped).length === 0) return undefined;
  return { groupOffsets: remapped };
}

export function mergeProtocolDiagramLayout(
  baseLayout: ProtocolDiagramLayout | undefined,
  incomingLayout: ProtocolDiagramLayout | undefined
): ProtocolDiagramLayout | undefined {
  const baseOffsets = baseLayout?.groupOffsets;
  const incomingOffsets = incomingLayout?.groupOffsets;

  if (!baseOffsets && !incomingOffsets) return undefined;
  if (!baseOffsets) return incomingLayout;
  if (!incomingOffsets) return baseLayout;

  return {
    groupOffsets: {
      ...baseOffsets,
      ...incomingOffsets,
    },
  };
}

export function protocolDiagramLayoutEquals(
  a: ProtocolDiagramLayout | undefined,
  b: ProtocolDiagramLayout | undefined
): boolean {
  const aOffsets = a?.groupOffsets;
  const bOffsets = b?.groupOffsets;

  if (!aOffsets && !bOffsets) return true;
  if (!aOffsets || !bOffsets) return false;

  const aKeys = Object.keys(aOffsets);
  const bKeys = Object.keys(bOffsets);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    const aOffset = aOffsets[key];
    const bOffset = bOffsets[key];
    if (!aOffset || !bOffset) return false;
    if (aOffset.dx !== bOffset.dx || aOffset.dy !== bOffset.dy) {
      return false;
    }
  }

  return true;
}
