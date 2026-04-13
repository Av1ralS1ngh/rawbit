import type { FlowNode } from "@/types";

const DEFAULT_GROUP_WIDTH = 300;
const DEFAULT_GROUP_HEIGHT = 200;
const DEFAULT_TEXT_WIDTH = 420;
const DEFAULT_TEXT_HEIGHT = 240;
const DEFAULT_SINGLE_WIDTH = 250;
const DEFAULT_SINGLE_HEIGHT = 100;
const DEFAULT_MULTI_WIDTH = 400;
const DEFAULT_MULTI_BASE_HEIGHT = 200;
const HANDLE_SPACING = 30;
const ROW_EXTRA_HEIGHT = 26;

const DEFAULT_PADDING = 16;
const DEFAULT_SHIFT_X = 36;
const DEFAULT_SHIFT_Y = 28;
const DEFAULT_MAX_ATTEMPTS = 220;

type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const countVisibleInputs = (node: FlowNode): number => {
  const data = node.data ?? {};
  const structure = (data.inputStructure as
    | {
        ungrouped?: Array<{ unconnectable?: boolean }>;
        groups?: Array<{
          title?: string;
          fields?: Array<{ unconnectable?: boolean }>;
        }>;
        betweenGroups?: Record<string, Array<{ unconnectable?: boolean }>>;
        afterGroups?: Array<{ unconnectable?: boolean }>;
      }
    | undefined) ?? {};

  let total = 0;

  (structure.ungrouped ?? []).forEach((field) => {
    if (!field.unconnectable) total += 1;
  });

  (structure.groups ?? []).forEach((group) => {
    const title = group.title;
    if (!title) return;

    const keys = (data.groupInstanceKeys as Record<string, number[]> | undefined)?.[title];
    const instanceCount = keys?.length
      ? keys.length
      : (data.groupInstances as Record<string, number> | undefined)?.[title] ?? 0;

    for (let i = 0; i < instanceCount; i += 1) {
      (group.fields ?? []).forEach((field) => {
        if (!field.unconnectable) total += 1;
      });
    }
  });

  Object.values(structure.betweenGroups ?? {}).forEach((fields) => {
    fields.forEach((field) => {
      if (!field.unconnectable) total += 1;
    });
  });

  (structure.afterGroups ?? []).forEach((field) => {
    if (!field.unconnectable) total += 1;
  });

  return total;
};

const maxUngroupedRows = (node: FlowNode): number => {
  const ungrouped = (node.data?.inputStructure as { ungrouped?: Array<{ rows?: number }> } | undefined)?.ungrouped;
  if (!ungrouped?.length) return 1;
  return ungrouped.reduce((maxRows, field) => {
    const rows = Number(field.rows ?? 1);
    return Number.isFinite(rows) ? Math.max(maxRows, rows) : maxRows;
  }, 1);
};

const estimateNodeSize = (node: FlowNode): { width: number; height: number } => {
  const data = node.data ?? {};

  if (node.type === "shadcnGroup") {
    return {
      width: Number(node.width ?? data.width ?? DEFAULT_GROUP_WIDTH),
      height: Number(node.height ?? data.height ?? DEFAULT_GROUP_HEIGHT),
    };
  }

  if (node.type === "shadcnTextInfo") {
    return {
      width: Number(node.width ?? data.width ?? DEFAULT_TEXT_WIDTH),
      height: Number(node.height ?? data.height ?? DEFAULT_TEXT_HEIGHT),
    };
  }

  const isMulti = data.paramExtraction === "multi_val";
  const explicitWidth = Number(node.measured?.width ?? node.width ?? data.width);
  const explicitHeight = Number(node.measured?.height ?? node.height ?? data.height);

  let width = Number.isFinite(explicitWidth)
    ? explicitWidth
    : isMulti
    ? DEFAULT_MULTI_WIDTH
    : DEFAULT_SINGLE_WIDTH;

  let height = Number.isFinite(explicitHeight)
    ? explicitHeight
    : isMulti
    ? DEFAULT_MULTI_BASE_HEIGHT + countVisibleInputs(node) * HANDLE_SPACING
    : DEFAULT_SINGLE_HEIGHT;

  if (data.showField === true) {
    const rows = maxUngroupedRows(node);
    if (rows > 1) {
      height += (rows - 1) * ROW_EXTRA_HEIGHT;
    }
  }

  if (!Number.isFinite(width) || width <= 0) width = DEFAULT_SINGLE_WIDTH;
  if (!Number.isFinite(height) || height <= 0) height = DEFAULT_SINGLE_HEIGHT;

  return { width, height };
};

const rectForNode = (
  node: FlowNode,
  position: { x: number; y: number } = node.position
): Rect => {
  const { width, height } = estimateNodeSize(node);
  return {
    left: position.x,
    top: position.y,
    right: position.x + width,
    bottom: position.y + height,
  };
};

const rectsOverlap = (a: Rect, b: Rect, padding = DEFAULT_PADDING): boolean => {
  return !(
    a.right + padding <= b.left ||
    a.left >= b.right + padding ||
    a.bottom + padding <= b.top ||
    a.top >= b.bottom + padding
  );
};

const sameParentScope = (a: FlowNode, b: FlowNode): boolean => {
  return (a.parentId ?? null) === (b.parentId ?? null);
};

export const resolveNodePosition = (
  candidate: FlowNode,
  existingNodes: readonly FlowNode[],
  options?: {
    padding?: number;
    shiftX?: number;
    shiftY?: number;
    maxAttempts?: number;
  }
): { x: number; y: number } => {
  const padding = options?.padding ?? DEFAULT_PADDING;
  const shiftX = options?.shiftX ?? DEFAULT_SHIFT_X;
  const shiftY = options?.shiftY ?? DEFAULT_SHIFT_Y;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const scoped = existingNodes.filter(
    (node) => node.id !== candidate.id && sameParentScope(candidate, node)
  );

  if (!scoped.length) {
    return candidate.position;
  }

  let position = { ...candidate.position };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidateRect = rectForNode(candidate, position);
    const hasOverlap = scoped.some((other) =>
      rectsOverlap(candidateRect, rectForNode(other), padding)
    );

    if (!hasOverlap) {
      return position;
    }

    position = {
      x: position.x + shiftX,
      y: position.y + shiftY,
    };
  }

  return position;
};

const hasTopLevelCollision = (
  topLevelImported: FlowNode[],
  topLevelExisting: FlowNode[],
  dx: number,
  dy: number,
  padding: number
): boolean => {
  if (!topLevelImported.length || !topLevelExisting.length) return false;

  return topLevelImported.some((importedNode) => {
    const shiftedRect = rectForNode(importedNode, {
      x: importedNode.position.x + dx,
      y: importedNode.position.y + dy,
    });

    return topLevelExisting.some((existingNode) =>
      rectsOverlap(shiftedRect, rectForNode(existingNode), padding)
    );
  });
};

export const offsetImportedTopLevelNodes = (
  importedNodes: readonly FlowNode[],
  existingNodes: readonly FlowNode[],
  options?: {
    padding?: number;
    shiftX?: number;
    shiftY?: number;
    maxAttempts?: number;
  }
): FlowNode[] => {
  const padding = options?.padding ?? DEFAULT_PADDING;
  const shiftX = options?.shiftX ?? DEFAULT_SHIFT_X;
  const shiftY = options?.shiftY ?? DEFAULT_SHIFT_Y;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const topLevelImported = importedNodes.filter((node) => !node.parentId);
  if (!topLevelImported.length) {
    return [...importedNodes];
  }

  const topLevelExisting = existingNodes.filter((node) => !node.parentId);
  if (!topLevelExisting.length) {
    return [...importedNodes];
  }

  let dx = 0;
  let dy = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!hasTopLevelCollision(topLevelImported, topLevelExisting, dx, dy, padding)) {
      break;
    }
    dx += shiftX;
    dy += shiftY;
  }

  if (dx === 0 && dy === 0) {
    return [...importedNodes];
  }

  return importedNodes.map((node) => {
    if (node.parentId) return node;
    return {
      ...node,
      position: {
        x: node.position.x + dx,
        y: node.position.y + dy,
      },
    };
  });
};
