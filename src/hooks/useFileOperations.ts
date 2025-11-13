import { useRef, useCallback } from "react";

const RESERVED_FILENAME_CHARS = new Set([
  "<",
  ">",
  ":",
  '"',
  "/",
  "\\",
  "|",
  "?",
  "*",
]);

const stripDisallowedFilenameChars = (input: string): string => {
  let result = "";
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127 || RESERVED_FILENAME_CHARS.has(char)) {
      result += " ";
    } else {
      result += char;
    }
  }
  return result;
};

const sanitizeFilename = (raw: string): string => {
  let value = raw;
  try {
    value = value.normalize("NFKC");
  } catch {
    /* ignore */
  }
  value = stripDisallowedFilenameChars(value);
  value = value.replace(/\s+/g, " ").trim();
  while (value.endsWith(".") || value.endsWith(" ")) {
    value = value.slice(0, -1);
  }
  if (value.length > 60) {
    value = value.slice(0, 60).trimEnd();
  }
  return value;
};
import type {
  FlowNode,
  FlowData,
  CalculationNodeData,
  FieldDefinition,
  GroupDefinition,
  InputStructure,
  ScriptExecutionResult,
} from "@/types";
import type { Edge, NodeChange, EdgeChange } from "@xyflow/react";
import { log } from "@/lib/logConfig";
import { importWithFreshIds } from "@/lib/idUtils";
import {
  FLOW_SCHEMA_VERSION,
  MAX_FLOW_BYTES,
  formatBytes,
  measureFlowBytes,
} from "@/lib/flow/schema";
import { validateFlowData } from "@/lib/flow/validate";
import type { FlowValidationIssue } from "@/lib/flow/validate";
import {
  ingestScriptSteps,
  hydrateNodesWithScriptSteps,
} from "@/lib/share/scriptStepsCache";
import {
  FlowFileCandidate,
  isFlowFileCandidate,
  isRecord,
  isXYPosition,
} from "@/lib/flow/guards";

// Strip ephemeral UI fields from saved JSON
const omitUIState = (key: string, value: unknown) =>
  key === "isHighlighted" || key === "searchMark" ? undefined : value;

const isFieldDefinition = (value: unknown): value is FieldDefinition =>
  isRecord(value) && typeof value.index === "number";

const isGroupDefinition = (value: unknown): value is GroupDefinition =>
  isRecord(value) && Array.isArray(value.fields);

interface SimplifiedInputEntry {
  label: string;
  val: unknown;
}

interface SimplifiedInputs {
  vals: Record<string, SimplifiedInputEntry>;
}

interface SimplifiedNodePayload {
  id: string;
  title?: string;
  functionName?: string;
  inputs?: SimplifiedInputs;
  result?: unknown;
  tutorial?: string;
  comment?: string;
  group?: string;
  error?: true;
  extendedError?: string;
  scriptDebugSteps?: ScriptExecutionResult | null;
}

interface SimplifiedEdgePayload {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface SimplifiedExportPayload {
  name: string;
  schemaVersion: number;
  nodes: SimplifiedNodePayload[];
  edges: SimplifiedEdgePayload[];
}

interface ImportBehaviorOptions {
  getNodes?: () => FlowNode[];
  getEdges?: () => Edge[];
  scheduleSnapshot?: (label: string, options?: { refresh?: boolean }) => void;
  fitView?: () => void;
  onTooltip?: (filename?: string) => void;
  onError?: (message: string, details?: FlowValidationIssue[]) => void;
  getActiveTabTitle?: () => string | undefined;
  renameActiveTab?: (title: string, options?: { onlyIfEmpty?: boolean }) => void;
}

export function useFileOperations(
  nodes: FlowNode[],
  edges: Edge[],
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void,
  onEdgesChange: (changes: EdgeChange[]) => void,
  importOptions?: ImportBehaviorOptions
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadCountsRef = useRef<Map<string, number>>(new Map());

  const getTabBaseTitle = useCallback((): string => {
    const raw = importOptions?.getActiveTabTitle?.();
    if (typeof raw === "string") {
      const sanitized = sanitizeFilename(raw);
      if (sanitized) return sanitized;
    }
    return "Flow";
  }, [importOptions]);

  const nextDownloadName = useCallback(
    (rawBase: string, extension = ".json"): string => {
      const ext = extension.startsWith(".") ? extension : `.${extension}`;
      const base = sanitizeFilename(rawBase) || getTabBaseTitle();
      const key = `${base}${ext.toLowerCase()}`;
      const count = downloadCountsRef.current.get(key) ?? 0;
      downloadCountsRef.current.set(key, count + 1);
      return count === 0 ? `${base}${ext}` : `${base} (${count})${ext}`;
    },
    [getTabBaseTitle]
  );

  /* ─────────────────────  SAVE FULL FLOW (unchanged)  ─────────────────── */
  const saveFlow = useCallback(() => {
    const nodesWithSteps = hydrateNodesWithScriptSteps(nodes);

    const payload: FlowData = {
      name: `flow-${Date.now()}`,
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: nodesWithSteps.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.position.x, y: n.position.y },
        data: n.data, // ✅ includes scriptDebugSteps when present
        parentId: n.parentId,
        extent: n.extent,
        width: n.width,
        height: n.height,
        dragHandle: n.dragHandle,
      })),
      edges: edges.map((e) => ({ ...e })),
    };

    const json = JSON.stringify(payload, omitUIState, 2);
    const bytes = measureFlowBytes(json);
    if (bytes > MAX_FLOW_BYTES) {
      const message = `Flow export is ${formatBytes(bytes)}, over the ${formatBytes(MAX_FLOW_BYTES)} limit.`;
      console.error(message);
      importOptions?.onError?.(message);
      return;
    }

    const blob = new Blob([json], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseTitle = getTabBaseTitle();
    a.download = nextDownloadName(baseTitle, ".json");
    const parent = document.body ?? document.documentElement;
    const canAppend =
      typeof Node !== "undefined" && parent && a instanceof Node && "appendChild" in parent;
    if (canAppend) {
      parent.appendChild(a);
    }
    a.click();
    if (canAppend) {
      parent.removeChild(a);
    }
    URL.revokeObjectURL(url);

    log("fileOps", "Flow saved to JSON file.");
  }, [nodes, edges, importOptions, getTabBaseTitle, nextDownloadName]);

  /* ─────────────────────────  FILE PICKER  ────────────────────────────── */
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  /* ──────────────────────────  LOAD / MERGE  ─────────────────────────── */
  // In useFileOperations.ts, update the handleFileSelect function:

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const filename = file.name;
      if (file.size > MAX_FLOW_BYTES) {
        const message = `Flow file is ${formatBytes(file.size)}, over the ${formatBytes(MAX_FLOW_BYTES)} limit.`;
        console.error(message);
        importOptions?.onError?.(message);
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result;
          if (!text || typeof text !== "string") {
            const message =
              "Could not read flow file contents. Please choose a valid JSON file.";
            console.error(message);
            importOptions?.onError?.(message);
            return;
          }

          const rawBytes = measureFlowBytes(text);
          if (rawBytes > MAX_FLOW_BYTES) {
            const message = `Flow file is ${formatBytes(rawBytes)}, over the ${formatBytes(MAX_FLOW_BYTES)} limit.`;
            console.error(message);
            importOptions?.onError?.(message);
            return;
          }

          const parsedUnknown = JSON.parse(text) as unknown;
          log("fileOps", "JSON loaded from file:", parsedUnknown);

          if (!isFlowFileCandidate(parsedUnknown)) {
            console.warn("Invalid flow file: missing nodes/edges.");
            importOptions?.onError?.(
              "Flow file is missing required nodes or edges collections."
            );
            return;
          }

          const parsedCandidate = parsedUnknown as FlowFileCandidate;

          // simplified snapshots don't have positions; skip importing them to the canvas
          const looksSimplified =
            parsedCandidate.nodes.length > 0 &&
            parsedCandidate.nodes.every(
              (node) => !isRecord(node) || !isXYPosition(node.position)
            );
          if (looksSimplified) {
            console.warn(
              "Simplified snapshot detected; skipping canvas import."
            );
            importOptions?.onError?.(
              "Simplified snapshots omit layout data and can't be loaded into the editor; export a full flow instead."
            );
            return;
          }

          const parsed = parsedCandidate as FlowData;
          if (parsed.schemaVersion === undefined) {
            parsed.schemaVersion = FLOW_SCHEMA_VERSION;
          }

          const validation = validateFlowData(parsed);
          if (!validation.ok) {
            const [firstError, ...restErrors] = validation.errors;
            const suffix =
              restErrors.length > 0
                ? ` (and ${restErrors.length} more issue${
                    restErrors.length === 1 ? "" : "s"
                  })`
                : "";
            const message = firstError
              ? `${firstError.message}${suffix}`
              : "Flow import failed validation.";
            console.error("Flow import blocked by validation", validation.errors);
            importOptions?.onError?.(message, validation.errors);
            return;
          }

          if (validation.warnings.length) {
            console.warn("Flow import warnings", validation.warnings);
          }

          // ① Use collision mode: keep IDs unless they conflict with existing nodes
          const { nodes: mergedNodes, edges: mergedEdges } = importWithFreshIds<
            FlowNode,
            Edge
          >({
            currentNodes: nodes,
            currentEdges: edges,
            importNodes: parsed.nodes,
            importEdges: parsed.edges,
            dedupeEdges: true,
            renameMode: "collision", // rename only when IDs collide
          });

          const sanitizedMergedNodes = ingestScriptSteps(mergedNodes);

          // ② safety: filter orphan edges (in case of hand-edited JSON)
          const importedNodeIds = new Set(
            sanitizedMergedNodes.map((n) => n.id)
          );
          const safeEdges = mergedEdges.filter(
            (e) =>
              importedNodeIds.has(e.source) && importedNodeIds.has(e.target)
          );

          // ③ add nodes (preserve shape; ensure groups keep a dragHandle)
          const addNodes = sanitizedMergedNodes.map((n) => {
            const dragHandle =
              n.type === "shadcnGroup"
                ? n.dragHandle ?? "[data-drag-handle]"
                : n.dragHandle;
            const item: FlowNode = {
              ...n,
              ...(dragHandle ? { dragHandle } : {}),
              selected: true,
            };
            return {
              type: "add" as const,
              item,
            };
          });

          // ④ add edges (IDs already handled by the merge step)
          const addEdges = safeEdges.map((e) => ({
            type: "add" as const,
            item: { ...e },
          }));

          // ⑤ deselect current, then append
          const deselect = nodes
            .filter((n) => n.selected)
            .map((n) => ({
              type: "select" as const,
              id: n.id,
              selected: false,
            }));

          onNodesChange([...deselect, ...addNodes]);
          onEdgesChange(addEdges);

          log("fileOps", "Flow imported (nodes/edges appended).");

          const beforeCount = importOptions?.getNodes
            ? importOptions.getNodes().length
            : undefined;

          const finalizeImport = () => {
            importOptions?.fitView?.();
            importOptions?.scheduleSnapshot?.("Import file", { refresh: true });
            if (filename) {
              importOptions?.onTooltip?.(filename);
              if (importOptions?.renameActiveTab && beforeCount === 0) {
                const baseName = filename.replace(/\.[^.]+$/, "").trim();
                if (baseName) {
                  importOptions.renameActiveTab(baseName, {
                    onlyIfEmpty: true,
                  });
                }
              }
            }
          };

          if (typeof beforeCount === "number" && importOptions?.getNodes) {
            const MAX_POLL_ATTEMPTS = 120;
            let attempts = 0;

            const poll = () => {
              const currentCount = importOptions.getNodes!().length;
              if (currentCount === beforeCount && attempts < MAX_POLL_ATTEMPTS) {
                attempts += 1;
                requestAnimationFrame(poll);
                return;
              }
              finalizeImport();
            };

            requestAnimationFrame(poll);
          } else {
            finalizeImport();
          }
        } catch (err: unknown) {
          const details =
            err instanceof Error && typeof err.message === "string"
              ? err.message
              : String(err);
          const message =
            err instanceof SyntaxError
              ? `Flow file is not valid JSON: ${details}`
              : `Could not parse flow JSON: ${details}`;
          console.error("Error parsing flow JSON", err);
          importOptions?.onError?.(message);
        }
      };

      reader.readAsText(file);
    },
    [nodes, edges, onNodesChange, onEdgesChange, importOptions]
  );

  /* ────────────────────  SAVE SIMPLIFIED SNAPSHOT  ──────────────────── */

  const saveSimplifiedFlow = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const nodesToSave = selectedNodes.length > 0 ? selectedNodes : nodes;
    const nodesWithSteps = hydrateNodesWithScriptSteps(nodesToSave);

    const nodeIdSet = new Set(nodesToSave.map((n) => n.id));
    const edgesToSave = edges.filter(
      (e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
    );

    const handleMap = new Map<string, Set<string>>();
    edgesToSave.forEach((e) => {
      if (!e.targetHandle) return;
      const set = handleMap.get(e.target) ?? new Set<string>();
      set.add(e.targetHandle);
      handleMap.set(e.target, set);
    });

    const groupIds = new Set(
      nodesToSave.filter((n) => n.type === "shadcnGroup").map((n) => n.id)
    );

    const slim: SimplifiedExportPayload = {
      name: `flow-${Date.now()}-simple`,
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: nodesWithSteps.map((n) => {
        const data = (n.data ?? {}) as CalculationNodeData &
          Record<string, unknown>;
        const fallbackType =
          typeof n.type === "string" && n.type.trim().length > 0
            ? n.type
            : "calculation";
        const functionName =
          typeof data.functionName === "string" &&
          data.functionName.trim().length > 0
            ? data.functionName
            : fallbackType;

        const labelMap: Record<string, string> = {};
        const addLabel = (index: unknown, label: unknown) => {
          if (
            (typeof index !== "number" && typeof index !== "string") ||
            typeof label !== "string"
          ) {
            return;
          }
          const trimmed = label.trim();
          if (!trimmed) return;
          labelMap[String(index)] = trimmed;
        };

        const structure: InputStructure | undefined = data.inputStructure;

        structure?.ungrouped?.forEach((field) =>
          addLabel(field.index, field.label)
        );

        structure?.groups?.forEach((group) => {
          const instanceKeys = data.groupInstanceKeys?.[group.title] ?? [];
          instanceKeys.forEach((instanceBaseIndex) => {
            group.fields.forEach((field) => {
              const offset =
                instanceBaseIndex +
                (typeof field.index === "number" ? field.index : 0);
              addLabel(offset, field.label);
            });
          });
        });

        if (structure?.betweenGroups) {
          Object.values(structure.betweenGroups).forEach((fields) => {
            fields.forEach((field) => addLabel(field.index, field.label));
          });
        }

        structure?.afterGroups?.forEach((field) =>
          addLabel(field.index, field.label)
        );

        if (structure) {
          Object.entries(structure as Record<string, unknown>).forEach(
            ([key, value]) => {
              if (!key.startsWith("group_") || value === undefined) return;
              if (Array.isArray(value)) {
                value.forEach((entry) => {
                  if (isFieldDefinition(entry)) {
                    addLabel(entry.index, entry.label);
                  }
                });
                return;
              }
              if (isGroupDefinition(value)) {
                const baseIndex =
                  typeof value.baseIndex === "number" ? value.baseIndex : 0;
                value.fields.forEach((field) => {
                  if (!isFieldDefinition(field)) return;
                  const absoluteIndex =
                    baseIndex +
                    (typeof field.index === "number" ? field.index : 0);
                  addLabel(absoluteIndex, field.label);
                });
              }
            }
          );
        }

        if (data.customFieldLabels) {
          Object.entries(data.customFieldLabels).forEach(([idx, label]) => {
            if (typeof label === "string" && label.trim().length > 0) {
              labelMap[idx] = label;
            }
          });
        }

        const rawInputs = data.inputs?.vals as unknown;
        let labelledInputs: SimplifiedInputs | undefined;
        if (
          rawInputs !== undefined &&
          rawInputs !== null &&
          typeof rawInputs === "object"
        ) {
          const entries = Object.entries(
            rawInputs as Record<string, unknown>
          );
          if (entries.length > 0) {
            const mapped = entries.reduce<
              Record<string, SimplifiedInputEntry>
            >((acc, [idx, val]) => {
              acc[idx] = {
                label: labelMap[idx] ?? "",
                val,
              };
              return acc;
            }, {});
            labelledInputs = { vals: mapped };
          }
        }

        const nodePayload: SimplifiedNodePayload = {
          id: n.id,
          title:
            typeof data.title === "string" && data.title.trim().length > 0
              ? data.title
              : functionName,
          functionName,
        };

        if (labelledInputs) nodePayload.inputs = labelledInputs;

        if (Object.prototype.hasOwnProperty.call(data, "result")) {
          nodePayload.result = data.result;
        }

        const tutorialCandidates = [
          data.content,
          data.markdown,
          (data as { text?: unknown }).text,
        ];
        const tutorial = tutorialCandidates.find(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        );
        if (tutorial) {
          nodePayload.tutorial = tutorial;
        }

        if (typeof data.comment === "string" && data.comment.trim()) {
          nodePayload.comment = data.comment;
        }

        if (n.parentId && groupIds.has(n.parentId)) {
          nodePayload.group = n.parentId;
        }

        const hasError =
          data.error === true ||
          data.hasError === true ||
          data.status === "error" ||
          (data as { state?: unknown }).state === "error";
        if (hasError) {
          nodePayload.error = true;
          if (
            typeof data.extendedError === "string" &&
            data.extendedError.trim()
          ) {
            nodePayload.extendedError = data.extendedError;
          }
        }

        if (data.scriptDebugSteps !== undefined) {
          nodePayload.scriptDebugSteps = data.scriptDebugSteps ?? null;
        }

        return nodePayload;
      }),
      edges: edgesToSave.map((e) => {
        const edgePayload: SimplifiedEdgePayload = {
          id: e.id,
          source: e.source,
          target: e.target,
        };
        if (e.sourceHandle) {
          edgePayload.sourceHandle = e.sourceHandle;
        }
        const targets = handleMap.get(e.target);
        if (e.targetHandle && targets && targets.size > 1) {
          edgePayload.targetHandle = e.targetHandle;
        }
        return edgePayload;
      }),
    };

    /* 4️⃣  Download */
    const slimJson = JSON.stringify(slim, omitUIState, 2);
    const slimBytes = measureFlowBytes(slimJson);
    if (slimBytes > MAX_FLOW_BYTES) {
      const message = `Simplified export is ${formatBytes(slimBytes)}, over the ${formatBytes(MAX_FLOW_BYTES)} limit.`;
      console.error(message);
      importOptions?.onError?.(message);
      return;
    }
    const blob = new Blob([slimJson], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const baseTitle = getTabBaseTitle();
    const suffix =
      selectedNodes.length > 0 ? " - simplified selection" : " - simplified";
    link.download = nextDownloadName(`${baseTitle}${suffix}`, ".json");
    const parent = document.body ?? document.documentElement;
    const canAppend =
      typeof Node !== "undefined" && parent && link instanceof Node && "appendChild" in parent;
    if (canAppend) {
      parent.appendChild(link);
    }
    link.click();
    if (canAppend) {
      parent.removeChild(link);
    }
    URL.revokeObjectURL(url);

    log(
      "fileOps",
      `Simplified flow saved (${
        selectedNodes.length ? "selection" : "full graph"
      }; labels inline).`
    );
  }, [nodes, edges, importOptions, getTabBaseTitle, nextDownloadName]);

  return {
    fileInputRef,
    saveFlow,
    openFileDialog,
    handleFileSelect,
    saveSimplifiedFlow,
  };
}
