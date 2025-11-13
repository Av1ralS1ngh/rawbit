import React, { useCallback, useMemo } from "react";

import { NodeProps, useReactFlow } from "@xyflow/react";

import { useNodeCalculationLogic } from "@/hooks/useCalculation";
import { useCalcNodeDerived } from "@/hooks/nodes/useCalcNodeDerived";
import { useCalcNodeMutations } from "@/hooks/nodes/useCalcNodeMutations";
import { useClipboardLite } from "@/hooks/nodes/useClipboardLite";
import { useGroupInstances } from "@/hooks/nodes/useGroupInstances";
import { CalculationNodeView } from "./calculation/CalculationNodeView";
import { getScriptSteps } from "@/lib/share/scriptStepsCache";
import type { FlowNode, NodeData } from "@/types";
import { useSnapshotSchedulerContext } from "@/hooks/useSnapshotSchedulerContext";

function CalculationNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { setNodes, setEdges } = useReactFlow<FlowNode>();
  const snapshotScheduler = useSnapshotSchedulerContext();

  const derived = useCalcNodeDerived(id, data as NodeData, setNodes);
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
