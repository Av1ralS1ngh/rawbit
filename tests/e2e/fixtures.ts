import { Buffer } from 'buffer';
import { createHash } from 'crypto';

import type { CalculationNodeData } from '@/types';

export interface RawFlowNode {
  id: string;
  data?: CalculationNodeData;
  [key: string]: unknown;
}

export interface ParsedBulkRequest {
  version: number;
  nodes: RawFlowNode[];
}

const isRawFlowNode = (value: unknown): value is RawFlowNode =>
  !!value && typeof value === 'object' && 'id' in value && typeof (value as { id: unknown }).id === 'string';

export const parseBulkRequestPayload = (payload: unknown): ParsedBulkRequest => {
  if (!payload || typeof payload !== 'object') {
    return { version: 1, nodes: [] };
  }

  const maybeVersion = (payload as { version?: unknown }).version;
  const version = typeof maybeVersion === 'number' ? maybeVersion : 1;
  const maybeNodes = (payload as { nodes?: unknown }).nodes;
  const nodes = Array.isArray(maybeNodes) ? maybeNodes.filter(isRawFlowNode) : [];
  return { version, nodes };
};

export const computeNodeResult = (
  data: CalculationNodeData | Record<string, unknown> | undefined
): string => {
  if (!data) return '';

  if (data.functionName === 'identity') {
    const inputs = data.inputs as { val?: unknown } | undefined;
    const directValue = inputs?.val ?? (data as { value?: unknown }).value;
    return String(directValue ?? '');
  }

  if (data.functionName === 'double_sha256_hex') {
    const inputs = data.inputs as { val?: unknown; vals?: unknown[] } | undefined;
    const input = inputs?.val ?? inputs?.vals?.[0] ?? '';
    return doubleSha256Hex(String(input ?? ''));
  }

  return String((data as { result?: unknown }).result ?? '');
};

export const enrichNodesForSuccess = (
  nodes: RawFlowNode[],
  resolveResult: (data: CalculationNodeData | Record<string, unknown> | undefined) => string = computeNodeResult
): RawFlowNode[] =>
  nodes.map((node) => {
    const data = { ...(node.data ?? {}) } as CalculationNodeData & Record<string, unknown>;
    const result = resolveResult(node.data);
    return {
      ...node,
      data: {
        ...data,
        dirty: false,
        error: false,
        extendedError: undefined,
        result,
      },
    } satisfies RawFlowNode;
  });

export const doubleSha256Hex = (hex: string): string => {
  const buffer = Buffer.from(hex || '', 'hex');
  const first = createHash('sha256').update(buffer).digest();
  return createHash('sha256').update(first).digest('hex');
};
