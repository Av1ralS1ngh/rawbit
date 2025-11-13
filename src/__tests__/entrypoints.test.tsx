import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, afterEach, vi } from "vitest";

const FlowStub = vi.hoisted(() => vi.fn(() => <div data-testid="flow-canvas" />));

vi.mock("@/components/Flow", () => ({
  __esModule: true,
  default: FlowStub,
}));

import App from "../App";

describe("App entry point", () => {
  it("renders the flow canvas via Flow component", () => {
    render(<App />);
    expect(screen.getByTestId("flow-canvas")).toBeInTheDocument();
    expect(FlowStub).toHaveBeenCalled();
  });
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  vi.doUnmock("react-dom/client");
});

describe("main entry point", () => {
  it("mounts the app within the theme provider", async () => {
    const renderMock = vi.fn();
    const createRootMock = vi.fn(() => ({ render: renderMock }));
    vi.doMock("react-dom/client", async () => {
      const actual = await vi.importActual<typeof import("react-dom/client")>(
        "react-dom/client"
      );
      return {
        ...actual,
        default: { ...actual, createRoot: createRootMock },
        createRoot: createRootMock,
      };
    });

    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    vi.resetModules();

    const { default: AppComponent } = await import("../App");

    const reactDomClient = await import("react-dom/client");
    expect(reactDomClient.createRoot).toBe(createRootMock);

    await act(async () => {
      await import("../main");
    });

    expect(createRootMock).toHaveBeenCalledWith(root);
    expect(renderMock).toHaveBeenCalledTimes(1);
    const tree = renderMock.mock.calls[0][0];
    expect(React.isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(React.StrictMode);

    const themeLayer = tree.props.children;
    expect(React.isValidElement(themeLayer)).toBe(true);
    const themeType = themeLayer.type as { name?: string; displayName?: string };
    expect(themeType?.name ?? themeType?.displayName ?? "").toContain(
      "ThemeProvider"
    );

    const renderedApp = themeLayer.props.children;
    expect(renderedApp.type).toBe(AppComponent);
  });
});
