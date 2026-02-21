/**
 * Unit tests for ConnectionHandles component
 * Focus: visibility guard, design token usage, drop target styling,
 * mouse interactions, named constants applied correctly
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ConnectionHandles } from "../../../../src/components/GanttChart/ConnectionHandles";
import { CONNECTION_HANDLE } from "../../../../src/styles/design-tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  taskId: "task-1",
  x: 100,
  y: 50,
  width: 200,
  height: 26,
  isVisible: true,
  isValidDropTarget: false,
  isInvalidDropTarget: false,
  onDragStart: vi.fn(),
  onHover: vi.fn(),
  onDrop: vi.fn(),
};

function renderHandles(
  overrides: Partial<typeof defaultProps> = {},
): ReturnType<typeof render> {
  return render(
    <svg>
      <ConnectionHandles {...defaultProps} {...overrides} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConnectionHandles", () => {
  // -------------------------------------------------------------------------
  // Visibility guard
  // -------------------------------------------------------------------------

  describe("visibility guard", () => {
    it("renders nothing when not visible and not a drop target", () => {
      const { container } = renderHandles({
        isVisible: false,
        isValidDropTarget: false,
        isInvalidDropTarget: false,
      });
      expect(container.querySelector(".connection-handles")).toBeNull();
    });

    it("renders when isVisible is true", () => {
      const { container } = renderHandles({ isVisible: true });
      expect(container.querySelector(".connection-handles")).not.toBeNull();
    });

    it("renders when isValidDropTarget even if not visible", () => {
      const { container } = renderHandles({
        isVisible: false,
        isValidDropTarget: true,
      });
      expect(container.querySelector(".connection-handles")).not.toBeNull();
    });

    it("renders when isInvalidDropTarget even if not visible", () => {
      const { container } = renderHandles({
        isVisible: false,
        isInvalidDropTarget: true,
      });
      expect(container.querySelector(".connection-handles")).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Handle structure
  // -------------------------------------------------------------------------

  describe("handle structure", () => {
    it("renders 4 circles (2 hit areas + 2 visible handles) when visible", () => {
      const { container } = renderHandles();
      const circles = container.querySelectorAll(
        ".connection-handles circle",
      );
      // 2 hit-area + 2 visible = 4
      expect(circles).toHaveLength(4);
    });

    it("renders 6 circles when drop target (2 hit areas + 2 visible + 2 rings)", () => {
      const { container } = renderHandles({ isValidDropTarget: true });
      const circles = container.querySelectorAll(
        ".connection-handles circle",
      );
      // 2 hit-area + 2 visible + 2 rings = 6
      expect(circles).toHaveLength(6);
    });
  });

  // -------------------------------------------------------------------------
  // Design tokens — neutral state
  // -------------------------------------------------------------------------

  describe("neutral state colors", () => {
    it("uses CONNECTION_HANDLE.neutralFill for handle fill", () => {
      const { container } = renderHandles();
      const visibleCircles = Array.from(
        container.querySelectorAll(".connection-handles circle"),
      ).filter((c) => c.getAttribute("fill") !== "transparent" && c.getAttribute("fill") !== "none");
      expect(visibleCircles.length).toBeGreaterThan(0);
      visibleCircles.forEach((c) => {
        expect(c.getAttribute("fill")).toBe(CONNECTION_HANDLE.neutralFill);
      });
    });

    it("uses CONNECTION_HANDLE.neutralStroke for handle stroke", () => {
      const { container } = renderHandles();
      const visibleCircles = Array.from(
        container.querySelectorAll(".connection-handles circle"),
      ).filter((c) => c.getAttribute("stroke") === CONNECTION_HANDLE.neutralStroke);
      expect(visibleCircles.length).toBe(2); // start + end handle
    });
  });

  // -------------------------------------------------------------------------
  // Design tokens — valid drop target
  // -------------------------------------------------------------------------

  describe("valid drop target colors", () => {
    it("uses CONNECTION_HANDLE.validFill for handle fill", () => {
      const { container } = renderHandles({ isValidDropTarget: true });
      const visibleCircles = Array.from(
        container.querySelectorAll(".connection-handles circle"),
      ).filter((c) => c.getAttribute("fill") === CONNECTION_HANDLE.validFill);
      expect(visibleCircles.length).toBe(2);
    });

    it("uses CONNECTION_HANDLE.validStroke for ring stroke", () => {
      const { container } = renderHandles({ isValidDropTarget: true });
      const rings = Array.from(
        container.querySelectorAll(".connection-handles circle"),
      ).filter(
        (c) =>
          c.getAttribute("fill") === "none" &&
          c.getAttribute("stroke") === CONNECTION_HANDLE.validStroke,
      );
      expect(rings.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Design tokens — invalid drop target
  // -------------------------------------------------------------------------

  describe("invalid drop target colors", () => {
    it("uses CONNECTION_HANDLE.invalidFill for handle fill", () => {
      const { container } = renderHandles({ isInvalidDropTarget: true });
      const visibleCircles = Array.from(
        container.querySelectorAll(".connection-handles circle"),
      ).filter(
        (c) => c.getAttribute("fill") === CONNECTION_HANDLE.invalidFill,
      );
      expect(visibleCircles.length).toBe(2);
    });

    it("uses CONNECTION_HANDLE.invalidStroke for ring stroke", () => {
      const { container } = renderHandles({ isInvalidDropTarget: true });
      const rings = Array.from(
        container.querySelectorAll(".connection-handles circle"),
      ).filter(
        (c) =>
          c.getAttribute("fill") === "none" &&
          c.getAttribute("stroke") === CONNECTION_HANDLE.invalidStroke,
      );
      expect(rings.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Mouse interactions
  // -------------------------------------------------------------------------

  describe("mouse interactions", () => {
    it("calls onDragStart with taskId and side on mousedown", () => {
      const onDragStart = vi.fn();
      const { container } = renderHandles({ onDragStart });

      // Get the first handle group's hit area (start handle)
      const hitAreas = container.querySelectorAll(
        ".connection-handles > g",
      );
      // First child <g> is start handle
      fireEvent.mouseDown(hitAreas[0]);

      expect(onDragStart).toHaveBeenCalledWith(
        "task-1",
        "start",
        expect.any(Object),
      );
    });

    it("calls onHover with taskId on mouseenter", () => {
      const onHover = vi.fn();
      const { container } = renderHandles({ onHover });

      const group = container.querySelector(".connection-handles")!;
      fireEvent.mouseEnter(group);

      expect(onHover).toHaveBeenCalledWith("task-1");
    });

    it("calls onDrop with taskId on mouseup", () => {
      const onDrop = vi.fn();
      const { container } = renderHandles({ onDrop });

      const group = container.querySelector(".connection-handles")!;
      fireEvent.mouseUp(group);

      expect(onDrop).toHaveBeenCalledWith("task-1");
    });
  });

  // -------------------------------------------------------------------------
  // Handle positioning
  // -------------------------------------------------------------------------

  describe("handle positioning", () => {
    it("positions start handle to the left of task bar", () => {
      const { container } = renderHandles({ x: 100, width: 200 });
      const circles = container.querySelectorAll(
        ".connection-handles circle",
      );
      // First circle (hit area) should be at x - 10 = 90
      expect(circles[0].getAttribute("cx")).toBe("90");
    });

    it("positions end handle to the right of task bar", () => {
      const { container } = renderHandles({ x: 100, width: 200 });
      const circles = container.querySelectorAll(
        ".connection-handles circle",
      );
      // Third circle (end hit area) should be at x + width + 10 = 310
      expect(circles[2].getAttribute("cx")).toBe("310");
    });

    it("centers handles vertically on task bar", () => {
      const { container } = renderHandles({ y: 50, height: 26 });
      const circles = container.querySelectorAll(
        ".connection-handles circle",
      );
      // cy should be y + height/2 = 50 + 13 = 63
      expect(circles[0].getAttribute("cy")).toBe("63");
    });
  });
});
