// src/components/share/SoftGateDialog.tsx
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type TurnstileTheme = "light" | "dark" | "auto";

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: TurnstileTheme;
  callback: (token: string) => void;
  "error-callback"?: () => void;
}

interface Turnstile {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  remove?(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: (token: string) => void;
  siteKey?: string;
};

export function SoftGateDialog({
  open,
  onClose,
  onVerified,
  siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ensure = async () => {
      if (window.turnstile) return setReady(true);
      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });
      setReady(true);
    };
    ensure();
  }, [open]);

  useEffect(() => {
    if (!open || !ready || !ref.current || !window.turnstile) return;
    const widgetId = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token: string) => onVerified(token),
      "error-callback": () => {
        /* ignore */
      },
    });
    return () => {
      window.turnstile?.remove?.(widgetId);
    };
  }, [open, ready, siteKey, onVerified]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick verification</DialogTitle>
          <DialogDescription>
            We limit shares during spikes to stop abuse.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4">
          <div ref={ref} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
