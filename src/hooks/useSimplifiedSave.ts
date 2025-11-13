import { useCallback, useState } from "react";
import type { FlowNode } from "@/types";

interface UseSimplifiedSaveOptions {
  nodes: FlowNode[];
  saveSimplifiedFlow: () => void;
}

export function useSimplifiedSave({
  nodes,
  saveSimplifiedFlow,
}: UseSimplifiedSaveOptions) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState("");

  const promptSave = useCallback(() => {
    const selected = nodes.filter((node) => node.selected).length;
    const total = nodes.length;

    if (selected > 0 && selected < total) {
      setMessage(`Save only the ${selected}/${total} selected nodes?`);
      setShowConfirmation(true);
      return;
    }

    saveSimplifiedFlow();
  }, [nodes, saveSimplifiedFlow]);

  const confirmSave = useCallback(() => {
    saveSimplifiedFlow();
    setShowConfirmation(false);
  }, [saveSimplifiedFlow]);

  const cancelSave = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  return {
    showConfirmation,
    confirmationMessage: message,
    promptSave,
    confirmSave,
    cancelSave,
  } as const;
}
