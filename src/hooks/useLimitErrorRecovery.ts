import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import { isCalculableNode } from "@/lib/flow/nonCalculableNodes";
import type { FlowNode } from "@/types";

export type SetNodesFn = Dispatch<SetStateAction<FlowNode[]>>;

export function useLimitErrorRecovery(
  hasLimitErrors: boolean,
  setNodes: SetNodesFn
) {
  return useCallback(() => {
    if (!hasLimitErrors) return;

    setNodes((prev) => {
      let mutated = false;

      const next = prev.map((node) => {
        if (!isCalculableNode(node) || !node.data) return node;

        const updates: typeof node.data & Record<string, unknown> = {
          ...node.data,
        };
        let changed = false;

        if (updates.dirty !== true) {
          updates.dirty = true;
          changed = true;
        }
        if (updates.error) {
          updates.error = false;
          changed = true;
        }
        if ("extendedError" in updates && updates.extendedError !== undefined) {
          delete updates.extendedError;
          changed = true;
        }
        if ("scriptDebugSteps" in updates) {
          delete updates.scriptDebugSteps;
          changed = true;
        }

        if (!changed) return node;

        mutated = true;
        return { ...node, data: updates };
      });

      return mutated ? next : prev;
    });
  }, [hasLimitErrors, setNodes]);
}
