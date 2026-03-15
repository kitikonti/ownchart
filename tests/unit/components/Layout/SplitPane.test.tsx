/**
 * Unit tests for SplitPane component.
 *
 * Covers mouse drag resize (normal, collapse, expand-from-collapsed),
 * handleExpandFromCollapsed via keyboard, and rendering states.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitPane } from "@/components/Layout/SplitPane";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultProps(): {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth: number;
  minLeftWidth: number;
  maxLeftWidth: number;
  onLeftWidthChange: ReturnType<typeof vi.fn>;
  isCollapsed: boolean;
  onCollapsedChange: ReturnType<typeof vi.fn>;
} {
  return {
    leftContent: <div data-testid="left">Left</div>,
    rightContent: <div data-testid="right">Right</div>,
    leftWidth: 300,
    minLeftWidth: 120,
    maxLeftWidth: 800,
    onLeftWidthChange: vi.fn(),
    isCollapsed: false,
    onCollapsedChange: vi.fn(),
  };
}

/**
 * Mock getBoundingClientRect on the container element (first child of the render).
 */
function mockContainerRect(container: HTMLElement): void {
  const containerEl = container.firstElementChild as HTMLElement;
  containerEl.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    right: 1000,
    bottom: 500,
    width: 1000,
    height: 500,
    x: 0,
    y: 0,
    toJSON: (): Record<string, never> => ({}),
  }));
}

/**
 * Start a drag on the divider then move and release the mouse.
 * Must call mockContainerRect before calling this.
 */
function dragDivider(clientX: number): void {
  const divider = screen.getByRole("separator");
  fireEvent.mouseDown(divider);
  fireEvent.mouseMove(document, { clientX });
  fireEvent.mouseUp(document);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SplitPane", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render left and right content", () => {
      render(<SplitPane {...getDefaultProps()} />);
      expect(screen.getByTestId("left")).toBeInTheDocument();
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });

    it("should not render left content when collapsed", () => {
      render(<SplitPane {...getDefaultProps()} isCollapsed={true} />);
      expect(screen.queryByTestId("left")).not.toBeInTheDocument();
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });

    it("should have a separator element", () => {
      render(<SplitPane {...getDefaultProps()} />);
      expect(screen.getByRole("separator")).toBeInTheDocument();
    });
  });

  describe("mouse drag resize — normal", () => {
    it("should update width on normal drag within bounds", () => {
      const props = getDefaultProps();
      const { container } = render(<SplitPane {...props} />);
      mockContainerRect(container);

      dragDivider(400);

      expect(props.onLeftWidthChange).toHaveBeenCalledWith(400);
    });

    it("should clamp to maxLeftWidth when dragged beyond max", () => {
      const props = getDefaultProps();
      props.maxLeftWidth = 500;
      const { container } = render(<SplitPane {...props} />);
      mockContainerRect(container);

      dragDivider(900);

      expect(props.onLeftWidthChange).toHaveBeenCalledWith(500);
    });

    it("should enforce minLeftWidth on mouseup", () => {
      const props = getDefaultProps();
      props.minLeftWidth = 200;
      const { container } = render(<SplitPane {...props} />);
      mockContainerRect(container);

      // Drag to 100 — above collapse threshold (80) but below minLeftWidth (200)
      dragDivider(100);

      expect(props.onLeftWidthChange).toHaveBeenCalledWith(200);
    });
  });

  describe("mouse drag resize — collapse", () => {
    it("should collapse when dragged below threshold", () => {
      const props = getDefaultProps();
      const { container } = render(<SplitPane {...props} />);
      mockContainerRect(container);

      // Drag below COLLAPSE_THRESHOLD (80px)
      dragDivider(50);

      expect(props.onCollapsedChange).toHaveBeenCalledWith(true);
    });

    it("should not call onLeftWidthChange when collapsing", () => {
      const props = getDefaultProps();
      const { container } = render(<SplitPane {...props} />);
      mockContainerRect(container);

      dragDivider(50);

      // When collapsing (finalWidth === 0), only onCollapsedChange is called
      expect(props.onLeftWidthChange).not.toHaveBeenCalled();
    });
  });

  describe("mouse drag resize — expand from collapsed", () => {
    it("should expand and set width when dragged from collapsed", () => {
      const props = getDefaultProps();
      props.isCollapsed = true;
      const { container } = render(<SplitPane {...props} />);
      mockContainerRect(container);

      // Drag to 300px (above threshold)
      dragDivider(300);

      expect(props.onCollapsedChange).toHaveBeenCalledWith(false);
      expect(props.onLeftWidthChange).toHaveBeenCalled();
      // The enforced width should be at least minLeftWidth
      const calledWidth = props.onLeftWidthChange.mock.calls[0][0];
      expect(calledWidth).toBeGreaterThanOrEqual(props.minLeftWidth);
    });
  });

  describe("handleExpandFromCollapsed", () => {
    it("should expand on Enter key when collapsed", () => {
      const props = getDefaultProps();
      props.isCollapsed = true;
      render(<SplitPane {...props} />);

      const divider = screen.getByRole("separator");
      fireEvent.keyDown(divider, { key: "Enter" });

      expect(props.onCollapsedChange).toHaveBeenCalledWith(false);
      expect(props.onLeftWidthChange).toHaveBeenCalled();
    });

    it("should restore at least minLeftWidth when expanding", () => {
      const props = getDefaultProps();
      props.isCollapsed = true;
      props.minLeftWidth = 200;
      render(<SplitPane {...props} />);

      const divider = screen.getByRole("separator");
      fireEvent.keyDown(divider, { key: "Enter" });

      const restoredWidth = props.onLeftWidthChange.mock.calls[0][0];
      expect(restoredWidth).toBeGreaterThanOrEqual(200);
    });

    it("should expand on click when collapsed", () => {
      const props = getDefaultProps();
      props.isCollapsed = true;
      render(<SplitPane {...props} />);

      const divider = screen.getByRole("separator");
      fireEvent.click(divider);

      expect(props.onCollapsedChange).toHaveBeenCalledWith(false);
    });
  });
});
