import React, { useCallback, useEffect, useMemo } from "react";

import { NodeProps, useReactFlow, useStore } from "@xyflow/react";

import { useNodeCalculationLogic } from "@/hooks/useCalculation";
import { useCalcNodeDerived } from "@/hooks/nodes/useCalcNodeDerived";
import { useCalcNodeMutations } from "@/hooks/nodes/useCalcNodeMutations";
import { useClipboardLite } from "@/hooks/nodes/useClipboardLite";
import { useGroupInstances } from "@/hooks/nodes/useGroupInstances";
import { CalculationNodeView } from "./calculation/CalculationNodeView";
import { getScriptSteps } from "@/lib/share/scriptStepsCache";
import type { FlowNode, NodeData } from "@/types";
import { useSnapshotSchedulerContext } from "@/hooks/useSnapshotSchedulerContext";
import { INSTANCE_STRIDE } from "@/lib/utils";
import type { Edge } from "@xyflow/react";

function CalculationNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { setNodes, setEdges } = useReactFlow<FlowNode>();
  const snapshotScheduler = useSnapshotSchedulerContext();

  const derived = useCalcNodeDerived(id, data as NodeData, setNodes);
  const connectedInputMeta = useStore(
    React.useCallback(
      (state: { edges: Edge[]; nodes: FlowNode[] }) => {
        const meta = new Map<number, { value: unknown; error: boolean }>();
        if (!state.edges.length) return meta;

        const nodesById = new Map(state.nodes.map((node) => [node.id, node]));
        state.edges.forEach((edge) => {
          if (edge.target !== id || !edge.targetHandle) return;
          if (!edge.targetHandle.startsWith("input-")) return;
          const index = parseInt(
            edge.targetHandle.replace("input-", ""),
            10
          );
          if (!Number.isFinite(index)) return;
          const sourceNode = nodesById.get(edge.source);
          if (!sourceNode) return;
          const sourceHandle = edge.sourceHandle ?? "";
          const outputValues = sourceNode.data?.outputValues;
          const hasCustomOutput =
            sourceHandle &&
            outputValues &&
            typeof outputValues === "object" &&
            sourceHandle in outputValues;
          meta.set(index, {
            value: hasCustomOutput
              ? (outputValues as Record<string, unknown>)[sourceHandle]
              : sourceHandle
              ? undefined
              : sourceNode.data?.result,
            error: Boolean(sourceNode.data?.error),
          });
        });

        return meta;
      },
      [id]
    )
  );
  const group = useGroupInstances(
    id,
    data as NodeData,
    setNodes,
    setEdges,
    {
      lockEdgeSnapshotSkip: snapshotScheduler.lockEdgeSnapshotSkip,
      releaseEdgeSnapshotSkip: snapshotScheduler.releaseEdgeSnapshotSkip,
    }
  );
  const mut = useCalcNodeMutations(id, setNodes, setEdges, {
    lockEdgeSnapshotSkip: snapshotScheduler.lockEdgeSnapshotSkip,
    releaseEdgeSnapshotSkip: snapshotScheduler.releaseEdgeSnapshotSkip,
    scheduleSnapshot: snapshotScheduler.scheduleSnapshot,
  });

  const { numInputs, value, result, error, handleChange } = useNodeCalculationLogic({
    id,
    data: data as NodeData,
    setNodes,
  });

  const rawTitle = (data as NodeData).title ?? (data as NodeData).functionName ?? "N/A";

  const clip = useClipboardLite({
    result,
    rawTitle,
    id,
    extendedError: (data as NodeData).extendedError as string | undefined,
  });

  const hasRegenerate = (data as NodeData).hasRegenerate === true;
  const showComment = (data as NodeData).showComment === true;
  const comment = (data as NodeData).comment ?? "";
  const showField = (data as NodeData).showField === true;
  const showHandle = !derived.isMultiVal && numInputs > 0 && !hasRegenerate;

  const isInputConnected = useCallback(
    (index: number) => derived.wiredHandles.has(`input-${index}`),
    [derived.wiredHandles]
  );
  const getInputMeta = useCallback(
    (index: number) => connectedInputMeta.get(index),
    [connectedInputMeta]
  );

  const singleValue = useMemo(() => {
    if (derived.isMultiVal) return undefined;
    return {
      showField,
      showHandle,
      value: typeof value === "string" ? value : undefined,
      onChange: handleChange,
    };
  }, [derived.isMultiVal, handleChange, showField, showHandle, value]);

  const scriptResult = getScriptSteps(id);
  const script = {
    isScriptVerification: (data as NodeData).functionName === "script_verification",
    scriptResult,
    scriptSigInputHex: (data as NodeData).inputs?.vals?.[0] || "",
    scriptPubKeyInputHex: (data as NodeData).inputs?.vals?.[1] || "",
  };

  useEffect(() => {
    const nodeData = data as NodeData;
    if (nodeData.outputLayout !== "taproot_tree_builder") return;

    const groupTitle = "LEAF_HASHES[]";
    const group = nodeData.inputStructure?.groups?.find(
      (entry) => entry.title === groupTitle
    );
    if (!group || group.fields.length === 0) return;

    const bases = nodeData.groupInstanceKeys?.[groupTitle]?.length
      ? nodeData.groupInstanceKeys?.[groupTitle] ?? []
      : Array.from(
          { length: nodeData.groupInstances?.[groupTitle] ?? 0 },
          (_, index) => group.baseIndex + index * INSTANCE_STRIDE
        );

    if (!bases.length) return;

    const nextLabels = { ...(nodeData.customFieldLabels ?? {}) };
    let changed = false;

    const labelForIndex = (index: number) => {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let label = "";
      let n = index;
      while (true) {
        const rem = n % 26;
        label = alphabet[rem] + label;
        n = Math.floor(n / 26);
        if (n === 0) break;
        n -= 1;
      }
      return `Leaf ${label}`;
    };

    bases.forEach((base, orderIndex) => {
      const fieldIndex = base + group.fields[0].index;
      if (!nextLabels[fieldIndex]) {
        nextLabels[fieldIndex] = labelForIndex(orderIndex);
        changed = true;
      }
    });

    if (!changed) return;

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...(node.data as NodeData),
                customFieldLabels: nextLabels,
              },
            }
          : node
      )
    );
  }, [data, id, setNodes]);

  return (
    <CalculationNodeView
      selected={!!selected}
      data={data as NodeData}
      rawTitle={rawTitle}
      derived={{
        isMultiVal: derived.isMultiVal,
        nodeWidth: derived.nodeWidth,
        minHeight: derived.minHeight,
        connectionStatus: derived.connectionStatus,
      }}
      isInputConnected={isInputConnected}
      getInputMeta={getInputMeta}
      mut={mut}
      group={group}
      clip={clip}
      singleValue={singleValue}
      result={result}
      error={!!error}
      hasRegenerate={hasRegenerate}
      showComment={showComment}
      comment={comment}
      script={script}
    />
  );
}

export default React.memo(CalculationNode, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.selected === next.selected &&
    prev.data === next.data
  );
});
