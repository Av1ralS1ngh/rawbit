import { useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExampleFlowOption = {
  id: string;
  label: string;
};

interface FirstRunDialogProps {
  open: boolean;
  flows: ExampleFlowOption[];
  onStartEmpty: () => void;
  onLoadExample: (flowId: string) => void;
}

const FALLBACK_FLOW_ID = "";

export function FirstRunDialog({
  open,
  flows,
  onStartEmpty,
  onLoadExample,
}: FirstRunDialogProps) {
  const actionRef = useRef<"empty" | "example" | null>(null);
  const defaultFlowId = useMemo(
    () => flows[0]?.id ?? FALLBACK_FLOW_ID,
    [flows]
  );
  const [selectedFlowId, setSelectedFlowId] = useState(defaultFlowId);

  useEffect(() => {
    if (open) {
      actionRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!flows.length) {
      setSelectedFlowId(FALLBACK_FLOW_ID);
      return;
    }
    if (!flows.some((flow) => flow.id === selectedFlowId)) {
      setSelectedFlowId(flows[0]?.id ?? FALLBACK_FLOW_ID);
    }
  }, [flows, selectedFlowId]);

  const handleStartEmpty = () => {
    actionRef.current = "empty";
    onStartEmpty();
  };

  const handleLoadClick = () => {
    if (!selectedFlowId) return;
    actionRef.current = "example";
    onLoadExample(selectedFlowId);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    if (actionRef.current === null) {
      actionRef.current = "empty";
      onStartEmpty();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to raw₿it</DialogTitle>
          <DialogDescription>
            Pick how you would like to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="rounded-md border p-4 space-y-3 bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Start from a blank canvas and build your flow by dragging nodes
              from the sidebar.
            </div>
            <Button variant="default" onClick={handleStartEmpty}>
              Start empty canvas
            </Button>
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Want a tour instead? Load one of our guided example flows.
              </p>
            </div>
            {flows.length ? (
              <>
                <Select
                  value={selectedFlowId}
                  onValueChange={setSelectedFlowId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an example flow" />
                  </SelectTrigger>
                  <SelectContent>
                    {flows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleLoadClick}
                  disabled={!selectedFlowId}
                >
                  Load example flow
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Example flows are not available right now.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
