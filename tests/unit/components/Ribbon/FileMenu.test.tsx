import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileMenu } from "../../../../src/components/Ribbon/FileMenu";

function createHandlers(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onRename: vi.fn(),
    onExport: vi.fn(),
  };
}

describe("FileMenu", () => {
  it("renders File button", () => {
    render(<FileMenu {...createHandlers()} />);
    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<FileMenu {...createHandlers()} />);
    fireEvent.click(screen.getByText("File"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders all menu items with correct roles", () => {
    render(<FileMenu {...createHandlers()} />);
    fireEvent.click(screen.getByText("File"));

    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(6);
  });

  it("renders keyboard shortcuts", () => {
    render(<FileMenu {...createHandlers()} />);
    fireEvent.click(screen.getByText("File"));

    expect(screen.getByText("Ctrl+Alt+N")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+O")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+Shift+S")).toBeInTheDocument();
    expect(screen.getByText("F2")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+E")).toBeInTheDocument();
  });

  it("calls action and closes menu on item click", () => {
    const handlers = createHandlers();
    render(<FileMenu {...handlers} />);

    // Open menu
    fireEvent.click(screen.getByText("File"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Click "New"
    fireEvent.click(screen.getByText("New"));
    expect(handlers.onNew).toHaveBeenCalledOnce();

    // Menu should be closed
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("sets aria-haspopup and aria-expanded on trigger", () => {
    render(<FileMenu {...createHandlers()} />);
    const button = screen.getByText("File");

    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("renders separator between Rename and Export", () => {
    render(<FileMenu {...createHandlers()} />);
    fireEvent.click(screen.getByText("File"));

    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
  });

  it.each([
    ["New", "onNew"],
    ["Open", "onOpen"],
    ["Save", "onSave"],
    ["Save As...", "onSaveAs"],
    ["Rename", "onRename"],
    ["Export", "onExport"],
  ] as const)("clicking %s calls %s", (label, handlerName) => {
    const handlers = createHandlers();
    render(<FileMenu {...handlers} />);

    fireEvent.click(screen.getByText("File"));
    fireEvent.click(screen.getByText(label));

    expect(handlers[handlerName]).toHaveBeenCalledOnce();
  });
});
