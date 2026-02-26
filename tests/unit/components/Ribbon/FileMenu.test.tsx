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

/** Helper: open the menu and return all menu items. */
function openMenu(): HTMLElement[] {
  fireEvent.click(screen.getByText("File"));
  return screen.getAllByRole("menuitem");
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

  it("uses type=button on trigger and all menu items", () => {
    render(<FileMenu {...createHandlers()} />);
    const trigger = screen.getByText("File");
    expect(trigger).toHaveAttribute("type", "button");

    fireEvent.click(trigger);
    const items = screen.getAllByRole("menuitem");
    for (const item of items) {
      expect(item).toHaveAttribute("type", "button");
    }
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

  // --- Keyboard navigation (WAI-ARIA Menu pattern) ---

  it("moves focus down with ArrowDown and wraps around", () => {
    render(<FileMenu {...createHandlers()} />);
    const items = openMenu();

    // Auto-focus lands on first item; ArrowDown → second
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();

    // Continue navigating down sequentially to reach last item
    fireEvent.keyDown(items[1], { key: "ArrowDown" });
    fireEvent.keyDown(items[2], { key: "ArrowDown" });
    fireEvent.keyDown(items[3], { key: "ArrowDown" });
    fireEvent.keyDown(items[4], { key: "ArrowDown" });
    expect(items[5]).toHaveFocus();

    // ArrowDown from last → wraps to first
    fireEvent.keyDown(items[5], { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();
  });

  it("moves focus up with ArrowUp and wraps around", () => {
    render(<FileMenu {...createHandlers()} />);
    const items = openMenu();

    // ArrowUp from first → wraps to last
    fireEvent.keyDown(items[0], { key: "ArrowUp" });
    expect(items[5]).toHaveFocus();

    // ArrowUp from last → second to last
    fireEvent.keyDown(items[5], { key: "ArrowUp" });
    expect(items[4]).toHaveFocus();
  });

  it("jumps to first/last item with Home/End", () => {
    render(<FileMenu {...createHandlers()} />);
    const items = openMenu();

    fireEvent.keyDown(items[0], { key: "End" });
    expect(items[5]).toHaveFocus();

    fireEvent.keyDown(items[5], { key: "Home" });
    expect(items[0]).toHaveFocus();
  });

  it("activates item with Enter key", () => {
    const handlers = createHandlers();
    render(<FileMenu {...handlers} />);
    const items = openMenu();

    // Navigate to Open (index 1)
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    fireEvent.keyDown(items[1], { key: "Enter" });

    expect(handlers.onOpen).toHaveBeenCalledOnce();
    // Menu should close after activation
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("activates item with Space key", () => {
    const handlers = createHandlers();
    render(<FileMenu {...handlers} />);
    const items = openMenu();

    fireEvent.keyDown(items[0], { key: " " });

    expect(handlers.onNew).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("sets tabIndex=-1 on menu items for managed focus", () => {
    render(<FileMenu {...createHandlers()} />);
    const items = openMenu();

    for (const item of items) {
      expect(item).toHaveAttribute("tabindex", "-1");
    }
  });

  it("moves focus to item on mouse hover", () => {
    render(<FileMenu {...createHandlers()} />);
    const items = openMenu();

    fireEvent.mouseEnter(items[3]);
    expect(items[3]).toHaveFocus();
  });

  it("keyboard activation uses hovered item after mouse enter", () => {
    const handlers = createHandlers();
    render(<FileMenu {...handlers} />);
    const items = openMenu();

    // Hover over Save (index 2), then press Enter
    fireEvent.mouseEnter(items[2]);
    fireEvent.keyDown(items[2], { key: "Enter" });

    expect(handlers.onSave).toHaveBeenCalledOnce();
  });
});
