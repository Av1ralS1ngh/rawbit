import { useContext } from "react";

import { UndoRedoContext } from "@/contexts/undo-redo";

export function useUndoRedo() {
  const ctx = useContext(UndoRedoContext);
  if (!ctx) {
    throw new Error("useUndoRedo must be used inside an UndoRedoProvider");
  }
  return ctx;
}
