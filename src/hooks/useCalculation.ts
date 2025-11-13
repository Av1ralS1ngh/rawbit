// src/hooks/useCalculation.ts
// ════════════════════════════════════════════════════════════════════════
// Responsibilities
// ----------------------------------------------------------------------
//   • GLOBAL hook  –  watches the *entire* flow for `data.dirty` flags,
//                    debounces, sends only the affected sub-graph to the
//                    backend, merges results, updates status banner.
//   • NODE hook    –  tiny helper for the node UI.  Right now it only
//                    does something special for
//                       – identity   (single editable value)
//                       – concat_all (multi-value read-only display)
//                    All logic is UI-side; no network calls here.
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { Edge, useReactFlow } from "@xyflow/react";

import {
  recalculateGraph,
  getAffectedSubgraph,
  mergePartialResultsIntoFullGraph,
  checkForCyclesAndMarkErrors,
} from "@/lib/graphUtils";
import { isCalculableNode } from "@/lib/flow/nonCalculableNodes";
import { log } from "@/lib/logConfig";
import { forEachFieldInstance } from "@/lib/nodes/fieldUtils";
import { getVal } from "@/lib/utils";
import { removeScriptSteps } from "@/lib/share/scriptStepsCache";
import type {
  UseNodeCalculationLogicProps,
  UseGlobalCalculationLogicProps,
  FlowNode,
  CalcError,
  NodeData,
} from "@/types";

type HandleMap = Map<string, Set<string>>;

function buildTargetHandleMap(edges: Edge[]): HandleMap {
  const map = new Map<string, Set<string>>();
  edges.forEach(({ target, targetHandle }) => {
    if (!target || !targetHandle) return;
    const handles = map.get(target) ?? new Set<string>();
    handles.add(targetHandle);
    map.set(target, handles);
  });
  return map;
}

function hasStoredValue(
  data: FlowNode["data"],
  index: number,
  fieldOptions?: string[]
): boolean {
  const raw = getVal(data?.inputs?.vals, index);
  if (raw !== "") return true;
  if (fieldOptions && fieldOptions.length > 0) return true;
  return false;
}

function isNodeReadyForCalculation(
  node: FlowNode,
  targetHandles: HandleMap
): boolean {
  const data = node.data;
  if (!data) return false;

  if ((data.paramExtraction ?? "single_val") !== "multi_val") {
    return true;
  }

  if ((data.functionName ?? "").toLowerCase() === "concat_all") {
    return true;
  }

  const handles = targetHandles.get(node.id) ?? new Set<string>();
  let missing = 0;

  forEachFieldInstance(data, (absoluteIndex, field) => {
    if (field.unconnectable) {
      return;
    }

    const handleId = `input-${absoluteIndex}`;
    if (handles.has(handleId)) {
      return;
    }

    if (!hasStoredValue(data, absoluteIndex, field.options)) {
      missing += 1;
    }
  });

  return missing === 0;
}

/* ────────────────────────────────────────────────────────────
   1.  GLOBAL CALCULATION HOOK
   ─   Debounce + partial-recalc pipeline (backend round-trip)
   ─────────────────────────────────────────────────────────── */
export function useGlobalCalculationLogic({
  nodes,
  edges,
  debounceMs = 500,
  onStatusChange,
}: UseGlobalCalculationLogicProps) {
  const { setNodes } = useReactFlow<FlowNode>();

  /* refs that outlive renders */
  const timeoutRef = useRef<number | null>(null);
  const versionRef = useRef<number>(0); // optimistic concurrency
  const prevDirtyRef = useRef<boolean>(false);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange; // keep fresh

  /* helper: merge backend + local errors */
  const buildErrorArray = (bErrors: CalcError[] = [], n: FlowNode[]) => {
    const localErrors: CalcError[] = n
      .filter((nd) => nd.data?.extendedError || nd.data?.error)
      .map((nd) => ({
        nodeId: nd.id,
        error: String(
          nd.data?.extendedError ?? nd.data?.error ?? "Unknown error"
        ),
      }));

    return [
      ...bErrors,
      ...localErrors.filter(
        (le) => !bErrors.some((be) => be.nodeId === le.nodeId)
      ),
    ];
  };

  /* watch nodes/edges every render */
  useEffect(() => {
    const dirtyNodes = nodes.filter(
      (n) => n.data?.dirty && isCalculableNode(n)
    );
    const anyDirty = dirtyNodes.length > 0;
    log("debounce", `dirtyNodes? ${anyDirty}`);

    if (!anyDirty) {
      if (prevDirtyRef.current) prevDirtyRef.current = false;
      return;
    }

    const handleMap = buildTargetHandleMap(edges);
    const readyDirtyNodes = dirtyNodes.filter((node) =>
      isNodeReadyForCalculation(node, handleMap)
    );
    const eligibleIds = new Set(readyDirtyNodes.map((node) => node.id));
    const unreadyDirtyNodes = dirtyNodes.filter(
      (node) => !eligibleIds.has(node.id)
    );

    if (unreadyDirtyNodes.length > 0) {
      const unreadyIds = new Set(unreadyDirtyNodes.map((node) => node.id));
      setNodes((nds) => {
        let mutated = false;
        const next = nds.map((node) => {
          if (!unreadyIds.has(node.id)) return node;
          const data = node.data as NodeData | undefined;
          if (!data) return node;

          const nextData: NodeData & Record<string, unknown> = { ...data };
          let changed = false;

          if (nextData.dirty) {
            nextData.dirty = false;
            changed = true;
          }
          if (nextData.error) {
            nextData.error = false;
            changed = true;
          }
          if (nextData.extendedError !== undefined) {
            delete nextData.extendedError;
            changed = true;
          }
          if (
            Object.prototype.hasOwnProperty.call(nextData, "result") &&
            nextData.result !== undefined
          ) {
            nextData.result = undefined;
            changed = true;
          }
          if (nextData.scriptDebugSteps !== undefined) {
            delete nextData.scriptDebugSteps;
            changed = true;
          }

          if (!changed) return node;
          mutated = true;
          return { ...node, data: nextData };
        });
        return mutated ? next : nds;
      });
      unreadyDirtyNodes.forEach((node) => removeScriptSteps(node.id));
    }

    if (readyDirtyNodes.length === 0) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (prevDirtyRef.current) {
        const mergedErrors = buildErrorArray([], nodes);
        onStatusChangeRef.current?.(
          mergedErrors.length ? "ERROR" : "OK",
          mergedErrors
        );
      }
      prevDirtyRef.current = false;
      return;
    }

    if (!prevDirtyRef.current) onStatusChangeRef.current?.("CALC");
    prevDirtyRef.current = true;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(async () => {
      log("debounce", "Debounce elapsed, preparing partial recalc…");
      const myVersion = ++versionRef.current;

      /* 1) which sub-graph changed? */
      const subgraphOptions = { eligibleNodeIds: eligibleIds };
      const { affectedNodes, affectedEdges } = getAffectedSubgraph(
        nodes,
        edges,
        subgraphOptions
      );
      if (affectedNodes.length === 0) {
        const mergedErrors = buildErrorArray([], nodes);
        onStatusChangeRef.current?.(
          mergedErrors.length ? "ERROR" : "OK",
          mergedErrors
        );
        prevDirtyRef.current = false;
        return;
      }

      /* 2) client-side cycle detection (fast fail) */
      const hasCycle = checkForCyclesAndMarkErrors(
        affectedNodes,
        affectedEdges
      );
      if (hasCycle) {
        log("debounce", "Cycle detected → mark subgraph as error");
        const affectedIds = new Set(affectedNodes.map((n) => n.id));
        setNodes((nds) =>
          nds.map((n) =>
            affectedIds.has(n.id)
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    error: true,
                    dirty: false,
                    extendedError: n.data.extendedError ?? "Cycle detected",
                  },
                }
              : n
          )
        );
        const mergedErrors = buildErrorArray([], nodes);
        onStatusChangeRef.current?.("ERROR", mergedErrors);
        prevDirtyRef.current = false;
        return;
      }

      /* 3) backend round-trip */
      try {
        const {
          nodes: recalcNodes,
          version,
          errors: backendErrors = [],
        } = await recalculateGraph(affectedNodes, affectedEdges, myVersion);

        /* stale response? ignore */
        if (version !== versionRef.current) {
          log(
            "debounce",
            `Ignoring outdated results (client ${versionRef.current} vs resp ${version})`
          );
          const mergedErrors = buildErrorArray([], nodes);
          onStatusChangeRef.current?.(
            mergedErrors.length ? "ERROR" : "OK",
            mergedErrors
          );
          prevDirtyRef.current = false;
          return;
        }

        /* merge partial update into full graph */
        const merged = mergePartialResultsIntoFullGraph(
          nodes,
          recalcNodes,
          backendErrors
        );
        setNodes(merged);

        const allErrors = buildErrorArray(backendErrors, merged);
        onStatusChangeRef.current?.(
          allErrors.length ? "ERROR" : "OK",
          allErrors
        );
        prevDirtyRef.current = false;
      } catch (err: unknown) {
        /* network / unexpected error → mark dirty nodes as error */
        log("debounce", "Unknown error in recalc", { err });
        const isAbort =
          typeof err === "object" &&
          err !== null &&
          "name" in err &&
          (err as { name?: unknown }).name === "AbortError";
        const fallbackMessage = isAbort
          ? "Calculation timed out after 5 s. Update any input in this flow to trigger another run."
          : "Calculation failed. Adjust the flow and try again.";

        const dirtyIds = new Set(
          nodes.filter((n) => n.data?.dirty).map((n) => n.id)
        );

        const nextNodes = nodes.map((n) => {
          if (!dirtyIds.has(n.id)) return n;
          return {
            ...n,
            data: {
              ...n.data,
              error: true,
              dirty: false,
              extendedError: fallbackMessage,
            },
          };
        });

        setNodes(nextNodes);

        const mergedErrors = buildErrorArray([], nextNodes);
        if (mergedErrors.length === 0) {
          mergedErrors.push({ nodeId: "__flow__", error: fallbackMessage });
        }

        onStatusChangeRef.current?.("ERROR", mergedErrors);
        prevDirtyRef.current = false;
      }
    }, debounceMs);

    /* cleanup if deps change or component unmounts */
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges, setNodes, debounceMs]);
}

/* ────────────────────────────────────────────────────────────
   2.  NODE-LEVEL HOOK
   ─   Returns UI helpers for a single node (identity / concat_all)
   ─────────────────────────────────────────────────────────── */
export function useNodeCalculationLogic({
  id,
  data,
  setNodes,
}: UseNodeCalculationLogicProps) {
  /* identity nodes are editable, everything else read-only */
  const isIdentity = data.functionName === "identity";
  const isConcatAll = data.isConcatAll === true;
  const numInputs = data.numInputs ?? 1;

  /* When a cable is attached we store upstream value in inputs.val.
     Keep showing that value even if the user later deletes the cable */
  const upstreamVal =
    typeof data.inputs?.val === "string"
      ? (data.inputs.val as string)
      : undefined;

  const displayValue = upstreamVal ?? (data.value as string) ?? "";

  /* user edits the single input field on an identity node */
  const handleChange = (newValue: string) => {
    if (!isIdentity) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                value: newValue,
                inputs: { ...(node.data.inputs || {}), val: newValue },
                dirty: true, // recalc needed
                error: false, // clear existing error while typing
              },
            }
          : node
      )
    );
  };

  /* expose to node components */
  return {
    isIdentity,
    isConcatAll,
    numInputs,
    value: displayValue,
    result: data.result,
    error: data.error,
    handleChange,
  };
}
