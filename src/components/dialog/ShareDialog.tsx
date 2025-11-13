import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateShare: () => Promise<{ id: string }>;
  createdId?: string | null;
}

export function ShareDialog({
  open,
  onClose,
  onCreateShare,
  createdId,
}: ShareDialogProps) {
  const [step, setStep] = useState<"confirm" | "created">("confirm");
  const [shareId, setShareId] = useState("");
  const [copiedLink, setCopiedLink] = useState<"app" | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open && createdId) {
      setShareId(createdId);
      setStep("created");
    }
  }, [open, createdId]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await onCreateShare();
      setShareId(result.id);
      setStep("created");
    } catch {
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const copyUrl = async (url: string, inputId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink("app");
      setTimeout(() => setCopiedLink(null), 2000);
      return;
    } catch {
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) {
        input.select();
        try {
          document.execCommand("copy");
          setCopiedLink("app");
          setTimeout(() => setCopiedLink(null), 2000);
        } catch {
          // noop
        }
      }
    }
  };

  const handleClose = () => {
    setStep("confirm");
    setShareId("");
    setCopiedLink(null);
    onClose();
  };

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://rawbit.io";
  const shareUrl = `${base}?s=${encodeURIComponent(shareId)}`; // URL-encode here too

  if (step === "confirm") {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent
          onInteractOutside={(e) => {
            if (isCreating) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isCreating) e.preventDefault(); // Also block Esc while creating
          }}
        >
          <DialogHeader>
            <DialogTitle>Share Workflow</DialogTitle>
            <DialogDescription>
              This will create a read-only link to the current snapshot of your
              workflow. Anyone with the link can view it; updates made later
              require a new share.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Close
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Share Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share link created</DialogTitle>
          <DialogDescription>
            Share this link with collaborators to give them read-only access to
            the current snapshot of your workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="share-link-app">App link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link-app"
                value={shareUrl}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={() => copyUrl(shareUrl, "share-link-app")}
                variant="outline"
              >
                {copiedLink === "app" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
