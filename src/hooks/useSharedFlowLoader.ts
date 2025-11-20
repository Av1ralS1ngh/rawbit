import { useEffect, useRef } from "react";
import type {
  Edge,
  EdgeChange,
  NodeChange,
  ReactFlowInstance,
} from "@xyflow/react";
import type { FlowData, FlowNode } from "@/types";
import { getShareJsonUrl, loadShared } from "@/lib/share";
import { importWithFreshIds } from "@/lib/idUtils";
import { validateFlowData } from "@/lib/flow/validate";
import { ingestScriptSteps } from "@/lib/share/scriptStepsCache";
import {
  FLOW_SCHEMA_VERSION,
  MAX_FLOW_BYTES,
  formatBytes,
  measureFlowBytes,
} from "@/lib/flow/schema";
import {
  isFlowFileCandidate,
  isRecord,
  isXYPosition,
} from "@/lib/flow/guards";

const SHARE_ALT_LINK_ID = "rawbit-share-json-link";

function setAlternateShareJsonLink(href?: string) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(
    SHARE_ALT_LINK_ID
  ) as HTMLLinkElement | null;

  if (!href) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing) {
    existing.href = href;
    return;
  }

  const link = document.createElement("link");
  link.id = SHARE_ALT_LINK_ID;
  link.rel = "alternate";
  link.type = "application/json";
  link.href = href;
  document.head.appendChild(link);
}

interface UseSharedFlowLoaderOptions {
  getNodes: () => FlowNode[];
  getEdges: () => Edge[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  scheduleSnapshot: (label: string, options?: { refresh?: boolean }) => void;
  setTabTooltip: (tabId: string, tooltip: string) => void;
  renameTab: (
    tabId: string,
    title: string,
    options?: { onlyIfEmpty?: boolean }
  ) => void;
  activeTabId: string;
  setInfoDialog: (state: { open: boolean; message: string }) => void;
  flowInstanceRef: React.MutableRefObject<ReactFlowInstance | null>;
  ensureShareImportTab?: () => string | null | Promise<string | null>;
}

export function useSharedFlowLoader({
  getNodes,
  getEdges,
  onNodesChange,
  onEdgesChange,
  scheduleSnapshot,
  setTabTooltip,
  renameTab,
  activeTabId,
  setInfoDialog,
  flowInstanceRef,
  ensureShareImportTab,
}: UseSharedFlowLoaderOptions) {
  const loadedSharedIdRef = useRef<string | null>(null);
  const loadingSharedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s") || params.get("share");
    if (!sharedId) {
      setAlternateShareJsonLink();
      return;
    }

    const shareJsonUrl = getShareJsonUrl(sharedId);
    if (shareJsonUrl) {
      setAlternateShareJsonLink(shareJsonUrl);
    } else {
      setAlternateShareJsonLink();
    }

    if (loadedSharedIdRef.current === sharedId) return;
    if (loadingSharedIdRef.current === sharedId) return;

    loadingSharedIdRef.current = sharedId;
    let cancelled = false;

    (async () => {
      try {
        const data = await loadShared(sharedId);

        if (cancelled) return;

        try {
          const rawBytes = measureFlowBytes(JSON.stringify(data));
          if (rawBytes > MAX_FLOW_BYTES) {
            const message = `Shared flow is ${formatBytes(rawBytes)}, over the ${formatBytes(MAX_FLOW_BYTES)} limit.`;
            console.error(message);
            setInfoDialog({ open: true, message });
            return;
          }
        } catch (sizeErr) {
          console.warn("Failed to measure shared flow size", sizeErr);
        }

        if (!isFlowFileCandidate(data)) {
          setInfoDialog({
            open: true,
            message: "Shared flow payload is empty or unreadable.",
          });
          return;
        }

        const rawNodes = data.nodes;
        const rawEdges = data.edges;

        const looksSimplified =
          rawNodes.length > 0 &&
          rawNodes.every(
            (node) => !isRecord(node) || !isXYPosition(node.position)
          );
        if (looksSimplified) {
          setInfoDialog({
            open: true,
            message:
              "Shared flow is a simplified snapshot that omits layout data and can't be loaded; request a full export instead.",
          });
          return;
        }

        const parsedData: FlowData = {
          ...(data as FlowData),
          nodes: rawNodes as FlowNode[],
          edges: rawEdges as Edge[],
        };

        if (parsedData.schemaVersion === undefined) {
          parsedData.schemaVersion = FLOW_SCHEMA_VERSION;
        }

        const validation = validateFlowData(parsedData);
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
            : "Shared flow failed validation.";
          console.error("Shared flow validation failed", validation.errors);
          setInfoDialog({
            open: true,
            message,
          });
          return;
        }

        if (validation.warnings.length) {
          console.warn("Shared flow validation warnings", validation.warnings);
        }

        const sharedNodes = parsedData.nodes;
        const sharedEdges = parsedData.edges;

        let targetTabId = activeTabId;
        const initialNodes = getNodes();
        const initialEdges = getEdges();
        const hadContent = initialNodes.length > 0 || initialEdges.length > 0;

        if (hadContent && ensureShareImportTab) {
          const ensuredId = await ensureShareImportTab();
          if (ensuredId) {
            targetTabId = ensuredId;
          }
        }

        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const targetWasEmpty =
          currentNodes.length === 0 && currentEdges.length === 0;

        const { nodes: mergedNodes, edges: mergedEdges } = importWithFreshIds<
          FlowNode,
          Edge
        >({
          currentNodes,
          currentEdges,
          importNodes: sharedNodes,
          importEdges: sharedEdges,
          dedupeEdges: true,
          renameMode: "collision",
        });

        const sanitizedNodes = ingestScriptSteps(mergedNodes);
        const importedNodeIds = new Set(sanitizedNodes.map((node) => node.id));
        const safeEdges = mergedEdges.filter(
          (edge) => importedNodeIds.has(edge.source) && importedNodeIds.has(edge.target)
        );

        const deselect = getNodes()
          .filter((node) => node.selected)
          .map((node) => ({
            type: "select" as const,
            id: node.id,
            selected: false,
          }));

        const addNodes = sanitizedNodes.map((node) => {
          const dragHandle =
            node.type === "shadcnGroup"
              ? node.dragHandle ?? "[data-drag-handle]"
              : node.dragHandle;

          return {
            type: "add" as const,
            item: {
              ...node,
              selected: true,
              position: node.position ?? { x: 0, y: 0 },
              data: node.data ?? {},
              type: node.type ?? "calculation",
              ...(dragHandle && { dragHandle }),
            } as FlowNode,
          };
        });

        const addEdges = safeEdges.map((edge) => ({
          type: "add" as const,
          item: { ...edge },
        }));

        if (cancelled) return;

        onNodesChange([...deselect, ...addNodes]);
        onEdgesChange(addEdges);

        if (cancelled) return;

        scheduleSnapshot(`Imported shared flow ${sharedId}`, {
          refresh: true,
        });

        if (cancelled) return;

        if (targetTabId) {
          setTabTooltip(targetTabId, `Shared: ${sharedId}`);
        }
        if (targetWasEmpty && targetTabId) {
          const metaName = (parsedData as { meta?: { name?: unknown } }).meta
            ?.name;
          const candidateTitles = [
            typeof parsedData.name === "string" ? parsedData.name : undefined,
            typeof metaName === "string" ? metaName : undefined,
            `Shared ${sharedId}`,
          ];
          const desiredTitle =
            candidateTitles.find(
              (value): value is string =>
                typeof value === "string" && value.trim().length > 0
            ) ?? `Shared ${sharedId}`;
          renameTab(targetTabId, desiredTitle, { onlyIfEmpty: true });
        }

        loadedSharedIdRef.current = sharedId;

        const instance = flowInstanceRef.current;
        if (instance) {
          requestAnimationFrame(() => {
            if (cancelled) return;
            instance.fitView({ padding: 0.2, maxZoom: 2, duration: 350 });
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          typeof err === "object" && err !== null && "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : "unknown error";
        setInfoDialog({
          open: true,
          message: `Could not load shared flow: ${message}`,
        });
      } finally {
        if (loadingSharedIdRef.current === sharedId) {
          loadingSharedIdRef.current = null;
        }
      }
    })();

    return () => {
      cancelled = true;
      if (loadingSharedIdRef.current === sharedId) {
        loadingSharedIdRef.current = null;
      }
      if (shareJsonUrl) {
        const existing = document.getElementById(
          SHARE_ALT_LINK_ID
        ) as HTMLLinkElement | null;
        if (existing && existing.href === shareJsonUrl) {
          existing.remove();
        }
      }
    };
  }, [
    activeTabId,
    flowInstanceRef,
    getEdges,
    getNodes,
    onEdgesChange,
    onNodesChange,
    scheduleSnapshot,
    setInfoDialog,
    setTabTooltip,
    renameTab,
    ensureShareImportTab,
  ]);
}
