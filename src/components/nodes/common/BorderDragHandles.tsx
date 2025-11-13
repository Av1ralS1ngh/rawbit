import React from "react";

interface BorderDragHandlesProps {
  borderWidth?: number;
  cornerGap?: number;
}

/**
 * Presents draggable borders around a node so the entire outline acts
 * as a drag handle inside React Flow.
 */
export function BorderDragHandles({
  borderWidth = 10,
  cornerGap = 16,
}: BorderDragHandlesProps) {
  const shared: React.CSSProperties = {
    position: "absolute",
    cursor: "grab",
    zIndex: 4,
  };
  const inset = borderWidth;
  const handleDepth = borderWidth * 2;
  const verticalGap = Math.max(0, cornerGap);

  return (
    <>
      <div
        data-drag-handle
        style={{
          ...shared,
          top: verticalGap,
          bottom: verticalGap,
          left: -inset,
          width: handleDepth,
        }}
        className="hover:bg-primary/10"
      />
      <div
        data-drag-handle
        style={{
          ...shared,
          bottom: -inset,
          left: verticalGap,
          right: verticalGap,
          height: handleDepth,
        }}
        className="hover:bg-primary/10"
      />
      <div
        data-drag-handle
        style={{
          ...shared,
          top: verticalGap,
          bottom: verticalGap,
          right: -inset,
          width: handleDepth,
        }}
        className="hover:bg-primary/10"
      />
    </>
  );
}
