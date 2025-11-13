// File: src/components/dialog/NodeCodeDialog.tsx

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Prism code highlighting
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import { useTheme } from "@/hooks/useTheme";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5007";

interface NodeCodeDialogProps {
  open: boolean;
  onClose: () => void;
  functionName?: string;
}

export function NodeCodeDialog({
  open,
  onClose,
  functionName,
}: NodeCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Use your custom theme (light/dark/system)
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      setIsDarkMode(true);
    } else if (theme === "light") {
      setIsDarkMode(false);
    } else {
      // System
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(media.matches);
      const handler = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme]);

  // Fetch code from the backend
  useEffect(() => {
    if (!open || !functionName) return;
    setLoading(true);
    setError("");
    setCode("");

    fetch(`${API_BASE_URL}/code?functionName=${encodeURIComponent(functionName)}`)
      .then((res) => res.json())
      .then((resp) => {
        setLoading(false);
        if (resp.error) {
          setError(resp.error);
          setCode("");
        } else {
          setCode(resp.code || "");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(String(err));
      });
  }, [open, functionName]);

  // Copy-to-clipboard
  const handleCopy = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      },
      (err) => console.error("Failed to copy code", err)
    );
  }, [code]);

  // Handle copy event to clean line numbers if needed
  useEffect(() => {
    if (!open) return;

    const handleCopyEvent = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Check if the selection is within our code dialog
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const codeContainer = document.querySelector(
        ".syntax-highlighter-container"
      );

      if (codeContainer && codeContainer.contains(container as Node)) {
        // Get the selected text
        let text = selection.toString();

        // Clean up any potential formatting issues
        // Remove line numbers if they somehow got included
        text = text.replace(/^\s*\d+\s*/gm, "");

        // Set the cleaned text to clipboard
        e.clipboardData?.setData("text/plain", text);
        e.preventDefault();
      }
    };

    // Stop keyboard events from propagating to the Flow component
    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop propagation for copy/paste/cut commands
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a"].includes(e.key.toLowerCase())
      ) {
        e.stopPropagation();
      }
    };

    document.addEventListener("copy", handleCopyEvent);
    document.addEventListener("keydown", handleKeyDown, true); // Use capture phase

    return () => {
      document.removeEventListener("copy", handleCopyEvent);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Python source for: <span className="italic">{functionName}</span>
          </DialogTitle>
          <DialogDescription>
            This is the source of your backend function:
          </DialogDescription>
        </DialogHeader>

        <div
          className="h-[500px] overflow-auto border p-2 bg-muted rounded-md syntax-highlighter-container"
          onKeyDown={(e) => e.stopPropagation()}
        >
          {loading && <div>Loading code...</div>}
          {!loading && error && (
            <div className="text-red-500">Error: {error}</div>
          )}

          {/* Syntax highlighter */}
          {!loading && !error && code && (
            <SyntaxHighlighter
              language="python"
              style={isDarkMode ? oneDark : oneLight}
              showLineNumbers
              wrapLongLines
              // Make line numbers unselectable
              lineNumberStyle={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
              // Additional container styles
              customStyle={{
                margin: 0,
                fontSize: "14px",
              }}
              // Code tag props to ensure proper selection
              codeTagProps={{
                style: {
                  fontFamily:
                    'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                },
              }}
            >
              {code}
            </SyntaxHighlighter>
          )}

          {!loading && !error && !code && <div>No code available</div>}
        </div>

        <DialogFooter className="mt-4 flex justify-between">
          <Button variant="outline" onClick={handleCopy} disabled={!code}>
            {copied ? "Copied!" : "Copy Code"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NodeCodeDialog;
