import React, { useEffect, useRef } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TerminalFieldProps {
  label: string;
  placeholder?: string;
  value?: string;
  readOnly?: boolean;
  small?: boolean;
  rows?: number;
  onChange?: (val: string) => void;
  onFocus?: (val: string) => void;
  onBlur?: (val: string) => void;
  onLabelChange?: (val: string) => void;
  allowEmpty00?: boolean;
  allowEmptyBlank?: boolean;
  emptyLabel?: string;
  comment?: string;
  is00?: boolean;
  isBlank?: boolean;
  onToggle00?: (checked: boolean) => void;
  onToggleBlank?: (checked: boolean) => void;
}

import { EditableLabel } from "./EditableLabel";

function terminalFieldPropsAreEqual(
  prev: TerminalFieldProps,
  next: TerminalFieldProps
) {
  return (
    prev.label === next.label &&
    prev.placeholder === next.placeholder &&
    prev.value === next.value &&
    prev.readOnly === next.readOnly &&
    prev.small === next.small &&
    prev.rows === next.rows &&
    prev.allowEmpty00 === next.allowEmpty00 &&
    prev.allowEmptyBlank === next.allowEmptyBlank &&
    prev.emptyLabel === next.emptyLabel &&
    prev.comment === next.comment &&
    prev.is00 === next.is00 &&
    prev.isBlank === next.isBlank &&
    prev.onChange === next.onChange &&
    prev.onFocus === next.onFocus &&
    prev.onBlur === next.onBlur &&
    prev.onLabelChange === next.onLabelChange &&
    prev.onToggle00 === next.onToggle00 &&
    prev.onToggleBlank === next.onToggleBlank
  );
}

/**
 * Terminal-style field (textarea + optional sentinel checkboxes).
 */
export const TerminalField = React.memo(function TerminalFieldComponent({
  label,
  placeholder,
  value,
  readOnly,
  small,
  rows,
  onChange,
  onFocus,
  onBlur,
  onLabelChange,
  allowEmpty00,
  allowEmptyBlank,
  emptyLabel,
  comment,
  is00,
  isBlank,
  onToggle00,
  onToggleBlank,
}: TerminalFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const onWheel = (event: WheelEvent) => {
      if (document.activeElement === ta) {
        event.stopPropagation();
        ta.scrollTop += event.deltaY;
      }
    };

    ta.addEventListener("wheel", onWheel, { passive: false });
    return () => ta.removeEventListener("wheel", onWheel);
  }, []);

  if (comment) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-3 cursor-help">
              <div className="mb-1 flex items-center justify-between font-mono text-sm text-primary">
                {onLabelChange ? (
                  <EditableLabel value={label} onCommit={onLabelChange} />
                ) : (
                  label
                )}

                <div className="flex items-center gap-3">
                  {allowEmpty00 && (
                    <div
                      className={cn(
                        "flex items-center gap-1 select-none",
                        is00 && "opacity-70"
                      )}
                      onPointerDownCapture={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={is00}
                        onCheckedChange={(checked) => onToggle00?.(!!checked)}
                        className="h-4 w-4 rounded-sm border border-primary data-[state=checked]:bg-background data-[state=checked]:text-black dark:data-[state=checked]:text-white"
                      />
                      00
                    </div>
                  )}

                  {allowEmptyBlank && (
                    <div
                      className={cn(
                        "flex items-center gap-1 select-none",
                        isBlank && "opacity-70"
                      )}
                      onPointerDownCapture={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isBlank}
                        onCheckedChange={(checked) =>
                          onToggleBlank?.(!!checked)
                        }
                        className="h-4 w-4 rounded-sm border border-primary data-[state=checked]:bg-background data-[state=checked]:text-black dark:data-[state=checked]:text-white"
                      />
                      {emptyLabel ?? "Ø"}
                    </div>
                  )}
                </div>
              </div>

              <textarea
                ref={textareaRef}
                className={cn(
                  "nodrag w-full resize-none rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                  "text-sm p-2 font-mono transition-colors",
                  small ? "w-32" : "w-full",
                  (isBlank || is00) &&
                    "text-muted-foreground",
                  readOnly ? "border-input" : "border-dashed border-input"
                )}
                placeholder={placeholder}
                value={value ?? ""}
                readOnly={readOnly}
                rows={rows ?? 3}
                spellCheck={false}
                onChange={(event) => onChange?.(event.target.value)}
                onFocus={(event) => onFocus?.(event.target.value)}
                onBlur={(event) => onBlur?.(event.target.value)}
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  cursor: readOnly ? "not-allowed" : "text",
                }}
              />
            </div>
          </TooltipTrigger>

          <TooltipContent side="top" align="center" className="max-w-xs">
            {comment}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between font-mono text-sm text-primary">
        {onLabelChange ? (
          <EditableLabel value={label} onCommit={onLabelChange} />
        ) : (
          label
        )}

        <div className="flex items-center gap-3">
          {allowEmpty00 && (
            <div
              className={cn(
                "flex items-center gap-1 select-none",
                is00 && "opacity-70"
              )}
              onPointerDownCapture={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={is00}
                onCheckedChange={(checked) => onToggle00?.(!!checked)}
                className="h-4 w-4 rounded-sm border border-primary data-[state=checked]:bg-background data-[state=checked]:text-black dark:data-[state=checked]:text-white"
              />
              00
            </div>
          )}

          {allowEmptyBlank && (
            <div
              className={cn(
                "flex items-center gap-1 select-none",
                isBlank && "opacity-70"
              )}
              onPointerDownCapture={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={isBlank}
                onCheckedChange={(checked) => onToggleBlank?.(!!checked)}
                className="h-4 w-4 rounded-sm border border-primary data-[state=checked]:bg-background data-[state=checked]:text-black dark:data-[state=checked]:text-white"
              />
              {emptyLabel ?? "Ø"}
            </div>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className={cn(
          "nodrag w-full resize-none rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "text-sm p-2 font-mono transition-colors",
          small ? "w-32" : "w-full",
          (is00 || isBlank) && "text-muted-foreground",
          readOnly ? "border-input" : "border-dashed border-input"
        )}
        placeholder={placeholder}
        value={value ?? ""}
        readOnly={readOnly}
        rows={rows ?? 3}
        spellCheck={false}
        onChange={(event) => onChange?.(event.target.value)}
        onFocus={(event) => onFocus?.(event.target.value)}
        onBlur={(event) => onBlur?.(event.target.value)}
        style={{
          maxHeight: "200px",
          overflowY: "auto",
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
    </div>
  );
},
terminalFieldPropsAreEqual);
