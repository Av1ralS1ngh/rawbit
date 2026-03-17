import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { Edge } from "@xyflow/react";
import type { ReactNode } from "react";

import { FlowCanvas } from "@/components/FlowCanvas";
import type { FlowNode } from "@/types";

type ReactFlowSpyProps = Record<string, unknown>;
type MiniMapSpyProps = {
  style?: {
    right?: number;
    width?: number;
    height?: number;
    bottom?: number;
  };
  maskColor?: string;
  [key: string]: unknown;
};

const reactFlowSpy: { props: ReactFlowSpyProps } = { props: {} };
const minimapSpy: { props: MiniMapSpyProps } = { props: {} };
const controlsSpy: { props: Record<string, unknown> } = { props: {} };

vi.mock("@xyflow/react", () => {
  return {
    ReactFlow: ({
      children,
      ...props
    }: { children: ReactNode } & Record<string, unknown>) => {
      reactFlowSpy.props = props;
      return <div data-testid="reactflow">{children}</div>;
    },
    MiniMap: (props: MiniMapSpyProps) => {
      minimapSpy.props = props;
      return <div data-testid="minimap" />;
    },
    Background: () => <div data-testid="background" />,
    Controls: (props: Record<string, unknown>) => {
      controlsSpy.props = props;
      return <div data-testid="controls" />;
    },
    SelectionMode: { Full: "full" },
  };
});

const nodeClassName = vi.fn();
const nodes: FlowNode[] = [];
const edges: Edge[] = [];

const baseProps = {
  nodeTypes: {},
  nodes,
  edges,
  showMiniMap: true,
  miniMapSize: { w: 100, h: 80 },
  miniMapOffset: 42,
  isDark: true,
  nodeClassName,
};

describe("FlowCanvas", () => {
  beforeEach(() => {
    reactFlowSpy.props = {};
    minimapSpy.props = {};
  });

  it("passes selection behaviour to ReactFlow", () => {
    render(
      <FlowCanvas
        {...baseProps}
        isSelectionModeActive
      />
    );

    expect(reactFlowSpy.props.selectionOnDrag).toBe(true);
    expect(reactFlowSpy.props.panOnDrag).toEqual([1]);
  });

  it("disables edge selectability while drag-selection mode is active", () => {
    render(
      <FlowCanvas
        {...baseProps}
        isSelectionModeActive
        edges={[
          {
            id: "edge-1",
            source: "node-a",
            target: "node-b",
            selected: true,
          } as Edge,
        ]}
      />
    );

    const passedEdges = reactFlowSpy.props.edges as Edge[];
    expect(passedEdges).toHaveLength(1);
    expect(passedEdges[0]?.selectable).toBe(false);
    expect(passedEdges[0]?.selected).toBe(false);
  });

  it("renders minimap with provided sizing and offset", () => {
    render(<FlowCanvas {...baseProps} />);

    expect(screen.getByTestId("minimap")).toBeInTheDocument();
    expect(minimapSpy.props.style).toBeDefined();
    const { style } = minimapSpy.props;
    expect(style?.right).toBe(baseProps.miniMapOffset);
    expect(style?.width).toBe(baseProps.miniMapSize.w);
    expect(style?.height).toBe(baseProps.miniMapSize.h);
    expect(minimapSpy.props.maskColor).toBe("rgba(0,0,0,0.35)");
  });

  it("omits minimap when disabled", () => {
    render(<FlowCanvas {...baseProps} showMiniMap={false} />);
    expect(screen.queryByTestId("minimap")).toBeNull();
  });

  it("passes the onMoveEnd handler through to ReactFlow", () => {
    const handleMoveEnd = vi.fn();
    render(<FlowCanvas {...baseProps} onMoveEnd={handleMoveEnd} />);
    expect(reactFlowSpy.props.onMoveEnd).toBe(handleMoveEnd);
  });
});
