import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { Sidebar } from "../Sidebar";
import type { NodeTemplate } from "@/types";
import { createDataTransfer } from "@/test-utils/dom";

function createSidebarNodes(): NodeTemplate[] {
  return [
    {
      functionName: "uint_to_hex",
      label: "Uint Parser",
      nodeData: { title: "Uint Parser" },
      category: "Input/Data",
      subcategory: "General",
      type: "calculation",
      description: "Parses uint values",
    },
    {
      functionName: "hash_util",
      label: "Hash Node",
      nodeData: { title: "Hash Node" },
      category: "Utility",
      subcategory: "General",
      type: "calculation",
    },
  ];
}

function createCustomFlows() {
  return [
    {
      id: "custom-flow",
      label: "Custom Flow",
      data: {
        nodes: [],
        edges: [],
      },
    },
  ];
}

const customFlowFixture = createCustomFlows();

vi.mock("@/components/sidebar-nodes", () => ({
  allSidebarNodes: createSidebarNodes(),
}));

vi.mock("@/my_tx_flows/customFlows", () => ({
  customFlows: createCustomFlows(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENV_LABEL", "staging");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const renderSidebar = () => render(<Sidebar isOpen onToggle={() => undefined} />);

  it("shows environment badge when label is set", () => {
    renderSidebar();
    expect(screen.getByText(/raw/i)).toHaveTextContent(/raw₿it\s*\(staging\)/i);
  });

  it("supports typo-tolerant search results", () => {
    renderSidebar();
    const input = screen.getByPlaceholderText("Search nodes...");
    fireEvent.change(input, { target: { value: "un" } });
    expect(screen.getByText("Uint Parser")).toBeInTheDocument();
    expect(screen.getByText(/Found 1 result/i)).toBeInTheDocument();
  });

  it("emits drag payloads for standard nodes", () => {
    renderSidebar();
    const card = screen.getByText("Uint Parser").closest("div");
    expect(card).not.toBeNull();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card!, { dataTransfer });

    const payload = dataTransfer.getData("application/reactflow");
    const parsed = JSON.parse(payload);
    expect(parsed).toMatchObject({
      functionName: "uint_to_hex",
      nodeData: { title: "Uint Parser" },
    });
  });

  it("renders Flow Examples accordion and drag payload includes subgraph data", () => {
    renderSidebar();

    const examplesTrigger = screen.getByText("Flow Examples");
    fireEvent.click(examplesTrigger);
    const customFlowCard = screen.getByText("Custom Flow").closest("div");
    expect(customFlowCard).not.toBeNull();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(customFlowCard!, { dataTransfer });
    const payload = dataTransfer.getData("application/reactflow");
    const parsed = JSON.parse(payload);

    expect(parsed).toMatchObject({
      type: "calculation",
      functionName: "flow_template",
      nodeData: { flowLabel: "Custom Flow", flowData: customFlowFixture[0].data },
    });
  });
});
