import { ConfirmationDialog } from "@/components/dialog/confirmation-dialog";
import ConnectDialog from "@/components/dialog/ConnectDialog";
import { ShareDialog } from "@/components/dialog/ShareDialog";
import { SoftGateDialog } from "@/components/share/SoftGateDialog";
import type { NodePorts } from "@/components/dialog/ConnectDialog";

interface FlowDialogLayerProps {
  closeDialog: { open: boolean; tabId: string | null };
  onConfirmTabClose: () => void;
  onCancelTabClose: () => void;

  showSaveConfirmation: boolean;
  saveConfirmationMessage: string;
  onConfirmSave: () => void;
  onCancelSave: () => void;
  showLlmSaveConfirmation: boolean;
  llmSaveConfirmationMessage: string;
  onConfirmLlmSave: () => void;
  onCancelLlmSave: () => void;

  infoDialog: { open: boolean; message: string };
  closeInfoDialog: () => void;

  connectOpen: boolean;
  setConnectOpen: (open: boolean) => void;
  allPorts: NodePorts[];
  sourcePorts: NodePorts | null;
  targetPorts: NodePorts | null;
  existingEdges: {
    source: string;
    sourceHandle: string | null;
    target: string;
    targetHandle: string | null;
  }[];
  onConnectApply: (
    edges: {
      source: string;
      sourceHandle: string | null;
      target: string;
      targetHandle: string | null;
    }[]
  ) => void;

  shareDialogOpen: boolean;
  shareCreatedId: string | null;
  closeShareDialog: () => void;
  requestShare: () => Promise<{ id: string }>;
  softGateOpen: boolean;
  closeSoftGate: () => void;
  verifyTurnstile: (token?: string) => Promise<{ id: string } | void | undefined>;
}

export function FlowDialogLayer({
  closeDialog,
  onConfirmTabClose,
  onCancelTabClose,
  showSaveConfirmation,
  saveConfirmationMessage,
  onConfirmSave,
  onCancelSave,
  showLlmSaveConfirmation,
  llmSaveConfirmationMessage,
  onConfirmLlmSave,
  onCancelLlmSave,
  infoDialog,
  closeInfoDialog,
  connectOpen,
  setConnectOpen,
  allPorts,
  sourcePorts,
  targetPorts,
  existingEdges,
  onConnectApply,
  shareDialogOpen,
  shareCreatedId,
  closeShareDialog,
  requestShare,
  softGateOpen,
  closeSoftGate,
  verifyTurnstile,
}: FlowDialogLayerProps) {
  return (
    <>
      <ConfirmationDialog
        isOpen={closeDialog.open}
        title="Close Tab"
        description="Are you sure you want to close this tab?"
        confirmText="Close"
        cancelText="Cancel"
        onConfirm={onConfirmTabClose}
        onClose={onCancelTabClose}
      />

      <ConfirmationDialog
        isOpen={showSaveConfirmation}
        title="Save Simplified Flow"
        description={saveConfirmationMessage}
        confirmText="Save"
        cancelText="Cancel"
        onConfirm={onConfirmSave}
        onClose={onCancelSave}
      />

      <ConfirmationDialog
        isOpen={showLlmSaveConfirmation}
        title="Save LLM Export"
        description={llmSaveConfirmationMessage}
        confirmText="Save"
        cancelText="Cancel"
        onConfirm={onConfirmLlmSave}
        onClose={onCancelLlmSave}
      />

      <ConfirmationDialog
        isOpen={infoDialog.open}
        title="Information"
        description={infoDialog.message}
        confirmText="OK"
        onConfirm={closeInfoDialog}
        onClose={closeInfoDialog}
      />

      {connectOpen && (
        <ConnectDialog
          open
          allPorts={allPorts}
          onClose={() => setConnectOpen(false)}
          onApply={onConnectApply}
          source={sourcePorts}
          target={targetPorts}
          existingEdges={existingEdges}
        />
      )}

      <ShareDialog
        open={shareDialogOpen}
        createdId={shareCreatedId}
        onClose={closeShareDialog}
        onCreateShare={requestShare}
      />

      <SoftGateDialog
        open={softGateOpen}
        onClose={closeSoftGate}
        onVerified={(token) => verifyTurnstile(token)}
      />
    </>
  );
}
