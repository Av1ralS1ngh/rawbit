import { render, screen, fireEvent } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { TopBar, type TopBarProps, type ExtraTopBarProps } from "@/components/layout/TopBar";

const undoMock = vi.fn();
const redoMock = vi.fn();
const setThemeMock = vi.fn<(theme: string) => void>();

vi.mock("@/hooks/useUndoRedo", () => ({
  useUndoRedo: () => ({ undo: undoMock, redo: redoMock, canUndo: false, canRedo: true }),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", setTheme: setThemeMock }),
}));

const fileInputRef: MutableRefObject<HTMLInputElement | null> = { current: null };

const baseProps: TopBarProps & ExtraTopBarProps = {
  isSidebarOpen: true,
  onToggle: vi.fn(),
  onSave: vi.fn(),
  onSaveSimplified: vi.fn(),
  onShare: vi.fn(),
  shareDisabled: true,
  onLoad: vi.fn(),
  onCopy: vi.fn(),
  onPaste: vi.fn(),
  canCopy: false,
  hasCopiedNodes: false,
  fileInputRef,
  onFileSelect: vi.fn(),
  calcStatus: "OK",
  errorInfo: [],
  errorCount: 0,
  showErrorPanel: false,
  setShowErrorPanel: vi.fn(),
  onRetryAll: vi.fn(),
  hasLimitErrors: false,
  onToggleColorPalette: vi.fn(),
  isColorPaletteOpen: false,
  canColorSelection: false,
  onGroup: vi.fn(),
  onUngroup: vi.fn(),
  canGroupSelectedNodes: () => false,
  canUngroupSelectedNodes: () => true,
  showUndoRedoPanel: false,
  setShowUndoRedoPanel: vi.fn(),
  tabs: [{ id: "tab-1", title: "Flow 1" }],
  activeTabId: "tab-1",
  onTabSelect: vi.fn(),
  onAddTab: vi.fn(),
  onCloseTab: vi.fn(),
  onRenameTab: vi.fn(),
  onConnectClick: vi.fn(),
  connectDisabled: true,
  onSearchClick: vi.fn(),
  setShowSearchPanel: vi.fn(),
  showMiniMap: true,
  onToggleMiniMap: vi.fn(),
  isSelectionModeActive: false,
  onToggleSelectionMode: vi.fn(),
};

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setThemeMock.mockClear();
  });

  it("disables share and undo buttons based on props", () => {
    render(<TopBar {...baseProps} />);

    expect(screen.getByTitle("Share snapshot")).toBeDisabled();
    expect(screen.getByTitle("Undo")).toBeDisabled();
    expect(screen.getByTitle("Redo")).not.toBeDisabled();
    expect(screen.getByTitle("Group")).toBeDisabled();
    expect(screen.getByTitle("Ungroup")).not.toBeDisabled();
  });

  it("invokes toggles for minimap, selection mode, and theme", () => {
    render(<TopBar {...baseProps} shareDisabled={false} />);

    fireEvent.click(screen.getByTitle("Hide minimap"));
    expect(baseProps.onToggleMiniMap).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Selection tool (click to toggle or hold S + drag with LMB)"));
    expect(baseProps.onToggleSelectionMode).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Toggle theme"));
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("opens share dialog handler when enabled", () => {
    render(<TopBar {...baseProps} shareDisabled={false} />);
    fireEvent.click(screen.getByTitle("Share snapshot"));
    expect(baseProps.onShare).toHaveBeenCalled();
  });

  it("hides retry-all button when errors are not limit-related", () => {
    render(<TopBar {...baseProps} calcStatus="ERROR" errorCount={1} />);
    const retry = screen.queryByTitle("Retry all nodes in this tab");
    expect(retry).not.toBeInTheDocument();
  });

  it("enables retry-all button and fires callback when limit errors exist", () => {
    render(
      <TopBar
        {...baseProps}
        calcStatus="ERROR"
        errorCount={1}
        hasLimitErrors
      />
    );
    const retry = screen.getByTitle("Retry all nodes in this tab");
    expect(retry).not.toBeDisabled();
    fireEvent.click(retry);
    expect(baseProps.onRetryAll).toHaveBeenCalled();
  });

  it("allows double-click renaming of tabs", () => {
    render(<TopBar {...baseProps} />);

    const tabTrigger = screen.getByText("Flow 1");
    fireEvent.doubleClick(tabTrigger);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "New Tab Name" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(baseProps.onRenameTab).toHaveBeenCalledWith("tab-1", "New Tab Name");
  });

  it("closes other panels before showing search", () => {
    const setShowUndoRedoPanel = vi.fn();
    const setShowErrorPanel = vi.fn();
    const onSearchClick = vi.fn();

    render(
      <TopBar
        {...baseProps}
        setShowUndoRedoPanel={setShowUndoRedoPanel}
        setShowErrorPanel={setShowErrorPanel}
        onSearchClick={onSearchClick}
      />
    );

    fireEvent.click(screen.getByTitle("Search nodes"));

    expect(setShowUndoRedoPanel).toHaveBeenCalledWith(false);
    expect(setShowErrorPanel).toHaveBeenCalledWith(false);
    expect(onSearchClick).toHaveBeenCalled();
  });

  it("closes search panel when toggling error list", () => {
    const setShowErrorPanel = vi.fn();
    const setShowSearchPanel = vi.fn();

    render(
      <TopBar
        {...baseProps}
        calcStatus="ERROR"
        errorCount={2}
        setShowErrorPanel={setShowErrorPanel}
        setShowSearchPanel={setShowSearchPanel}
      />
    );

    fireEvent.click(screen.getByTitle("Show errors"));

    expect(setShowSearchPanel).toHaveBeenCalledWith(false);
    expect(setShowErrorPanel).toHaveBeenCalledWith(true);
  });

  it("invokes simplified save when holding the S key", () => {
    const onSave = vi.fn();
    const onSaveSimplified = vi.fn();

    render(
      <TopBar
        {...baseProps}
        onSave={onSave}
        onSaveSimplified={onSaveSimplified}
      />
    );

    fireEvent.keyDown(window, { key: "s" });
    fireEvent.click(screen.getByTitle("Save (hold S for simplified)"));
    expect(onSaveSimplified).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.keyUp(window, { key: "s" });
    fireEvent.click(screen.getByTitle("Save (hold S for simplified)"));
    expect(onSave).toHaveBeenCalled();
  });
});
