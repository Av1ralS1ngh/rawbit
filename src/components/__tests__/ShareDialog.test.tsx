import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ShareDialog } from "@/components/dialog/ShareDialog";

const mockClipboard = {
  writeText: vi.fn<(value: string) => Promise<void>>(),
};

const execCommandMock = vi.fn();

describe("ShareDialog", () => {
  beforeEach(() => {
    const fakeNavigator = { clipboard: mockClipboard } as unknown as Navigator;
    vi.stubGlobal("navigator", fakeNavigator);
    Object.defineProperty(document, "execCommand", {
      value: execCommandMock,
      configurable: true,
      writable: true,
    });
    mockClipboard.writeText.mockReset();
    execCommandMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls onCreateShare and transitions to created view", async () => {
    const onCreateShare = vi.fn().mockResolvedValue({ id: "abc" });
    const onClose = vi.fn();

    render(
      <ShareDialog
        open
        onClose={onClose}
        onCreateShare={onCreateShare}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /create share link/i }));
    await waitFor(() => expect(onCreateShare).toHaveBeenCalled());

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons).toHaveLength(1);
  });

  it("pre-populates created step when createdId provided", () => {
    render(
      <ShareDialog
        open
        createdId="pre"
        onClose={vi.fn()}
        onCreateShare={vi.fn()}
      />
    );

    const appValue = (screen.getByLabelText(/App link/i) as HTMLInputElement).value;
    expect(appValue).toMatch(/\?s=pre$/);
  });

  it("copies share link via clipboard with fallback", async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error("no clipboard"));

    render(
      <ShareDialog
        open
        createdId="copyme"
        onClose={vi.fn()}
        onCreateShare={vi.fn()}
      />
    );

    const appInput = screen.getByLabelText(/app link/i) as HTMLInputElement;

    const buttons = screen.getAllByRole("button", { name: /copy/i });
    fireEvent.click(buttons[0]);

    await waitFor(() =>
      expect(mockClipboard.writeText).toHaveBeenCalledWith(appInput.value)
    );
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });
});
