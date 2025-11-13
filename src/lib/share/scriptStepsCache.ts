import type { FlowNode, ScriptExecutionResult } from "@/types";

export type ScriptStepsEntry = [string, ScriptExecutionResult | null];

let scriptSteps = new Map<string, ScriptExecutionResult | null>();

function cloneNode(node: FlowNode) {
  return {
    ...node,
    data: node.data ? { ...node.data } : node.data,
  } as FlowNode;
}

export function getScriptSteps(nodeId: string): ScriptExecutionResult | null {
  return scriptSteps.get(nodeId) ?? null;
}

export function setScriptSteps(
  nodeId: string,
  steps: ScriptExecutionResult | null | undefined
) {
  if (steps === undefined) return;
  scriptSteps.set(nodeId, steps ?? null);
}

export function removeScriptSteps(nodeId: string) {
  scriptSteps.delete(nodeId);
}

export function snapshotScriptSteps(): ScriptStepsEntry[] {
  return Array.from(scriptSteps.entries());
}

export function restoreScriptSteps(entries: ScriptStepsEntry[] | undefined) {
  scriptSteps = new Map(entries ?? []);
}

type NodeDataWithSteps = {
  scriptDebugSteps?: ScriptExecutionResult | null;
  scriptSteps?: ScriptExecutionResult | null;
};

function extractStepsFromData(
  data: unknown
): ScriptExecutionResult | null | undefined {
  if (!data || typeof data !== "object") return undefined;
  const withSteps = data as NodeDataWithSteps;
  if (withSteps.scriptDebugSteps !== undefined) {
    return withSteps.scriptDebugSteps ?? null;
  }
  if (withSteps.scriptSteps !== undefined) {
    return withSteps.scriptSteps ?? null;
  }
  return undefined;
}

export function ingestScriptSteps(nodes: FlowNode[]): FlowNode[] {
  let mutated = false;
  const result = nodes.map((node) => {
    const steps = extractStepsFromData(node.data);
    if (steps !== undefined) {
      setScriptSteps(node.id, steps);
      mutated = true;
      const clone = cloneNode(node);
      if (clone.data) {
        const dataWithSteps = clone.data as NodeDataWithSteps;
        delete dataWithSteps.scriptDebugSteps;
        delete dataWithSteps.scriptSteps;
      }
      return clone;
    }
    return node;
  });
  return mutated ? result : nodes;
}

export function hydrateNodesWithScriptSteps(
  nodes: FlowNode[],
  entries: ScriptStepsEntry[] | undefined = undefined
): FlowNode[] {
  const map = entries ? new Map(entries) : scriptSteps;
  let mutated = false;
  const result = nodes.map((node) => {
    if (!map.has(node.id)) return node;
    const steps = map.get(node.id) ?? null;
    const clone = cloneNode(node);
    if (clone.data) {
      const dataWithSteps = clone.data as NodeDataWithSteps;
      dataWithSteps.scriptDebugSteps = steps;
    }
    mutated = true;
    return clone;
  });
  return mutated ? result : nodes;
}
