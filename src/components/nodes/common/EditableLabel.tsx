import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface EditableLabelProps {
  value: string;
  onCommit: (value: string) => void;
  maxLength?: number;
  className?: string;
  fontSize?: number;
  fallback?: string;
}

/**
 * Reusable inline editable label used by node headers.
 * Supports double-click to edit with escape/enter handling and
 * optional font-size override.
 */
export function EditableLabel({
  value,
  onCommit,
  maxLength = 100,
  className = "",
  fontSize = 16,
  fallback = "Group Node",
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => setTempValue(value), [value]);

  const labelStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 400,
  };

  if (!isEditing) {
    return (
      <button
        className={cn(
          "text-left truncate w-full p-0 bg-transparent focus:outline-none",
          className
        )}
        style={{ ...labelStyle, userSelect: "text", whiteSpace: "pre" }}
        onDoubleClick={() => setIsEditing(true)}
        title="Double-click to rename"
      >
        {value || fallback}
      </button>
    );
  }

  return (
    <input
      className={cn(
        "w-full bg-transparent rounded-sm px-1 py-0.5 border border-input",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      style={labelStyle}
      autoFocus
      value={tempValue}
      maxLength={maxLength}
      onChange={(event) => setTempValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onCommit(
            tempValue.trim().length ? tempValue : fallback
          );
          setIsEditing(false);
        } else if (event.key === "Escape") {
          setIsEditing(false);
        }
      }}
      onBlur={() => {
        onCommit(
          tempValue.trim().length ? tempValue : fallback
        );
        setIsEditing(false);
      }}
    />
  );
}
