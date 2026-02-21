/**
 * Unit tests for DependencyArrow component
 * Focus: magic number → constant extraction, selection visuals,
 * keyboard/mouse interaction, null-guard early returns
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DependencyArrow } from "../../../../src/components/GanttChart/DependencyArrow";
import type { Dependency, TaskPosition } from "../../../../src/types/dependency.types";
import { COLORS } from "../../../../src/styles/design-tokens";

// ---------------------------------------------------------------------------
// Mock arrowPath utils to avoid complex SVG path calculations
// ---------------------------------------------------------------------------

vi.mock("../../../../src/utils/arrowPath", () => ({
  ARROWHEAD_SIZE: 8,
  calculateArrowPath: vi.fn(() => ({
    path: "M 0 0 L 100 100",
    arrowHead: { x: 100, y: 100, angle: 45 },
  })),
  getArrowheadPoints: vi.fn((size: number) => `0,${-size} ${size},0 0,${size}`),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fromTaskName = "From Task";
const toTaskName = "To Task";

const dependency: Dependency = {
  id: "dep-1",
  fromTaskId: "task-1",
  toTaskId: "task-2",
  type: "FS",
  createdAt: "2025-01-01",
};

function makePositions(): Map<string, TaskPosition> {
  const map = new Map<string, TaskPosition>();
  map.set("task-1", { x: 50, y: 10, width: 100, height: 26 });
  map.set("task-2", { x: 200, y: 46, width: 100, height: 26 });
  return map;
}

function renderArrow(
  overrides: Partial<Parameters<typeof DependencyArrow>[0]> = {},
): ReturnType<typeof render> {
  const defaults = {
    dependency,
    fromTaskName,
    toTaskName,
    taskPositions: makePositions(),
    rowHeight: 36,
    isSelected: false,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
  };
  return render(
    <svg>
      <DependencyArrow {...defaults} {...overrides} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DependencyArrow", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders the arrow group with correct aria-label", () => {
      const { container } = renderArrow();
      const g = container.querySelector(".dependency-arrow");
      expect(g).not.toBeNull();
      expect(g!.getAttribute("aria-label")).toBe(
        "Dependency from From Task to To Task",
      );
    });

    it("renders hit area, arrow path, and arrowhead polygon", () => {
      const { container } = renderArrow();
      const paths = container.querySelectorAll("path");
      // hit area (transparent) + arrow path + (no selection overlay)
      expect(paths.length).toBeGreaterThanOrEqual(2);
      const polygon = container.querySelector("polygon");
      expect(polygon).not.toBeNull();
    });

    it("uses design-token color for unselected state", () => {
      const { container } = renderArrow({ isSelected: false });
      const arrowPath = container.querySelectorAll("path")[1]; // second path is the visible arrow
      expect(arrowPath.getAttribute("stroke")).toBe(
        COLORS.chart.dependencyDefault,
      );
    });

    it("uses design-token color for selected state", () => {
      const { container } = renderArrow({ isSelected: true });
      const arrowPath = container.querySelectorAll("path")[1];
      expect(arrowPath.getAttribute("stroke")).toBe(
        COLORS.chart.dependencySelected,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Selection visual
  // -------------------------------------------------------------------------

  describe("selection overlay", () => {
    it("shows dashed selection overlay when selected", () => {
      const { container } = renderArrow({ isSelected: true });
      // 3 paths: hit area + arrow + selection overlay
      const paths = container.querySelectorAll("path");
      expect(paths).toHaveLength(3);
      const overlay = paths[2];
      expect(overlay.getAttribute("stroke-dasharray")).toBe("4 2");
      expect(overlay.getAttribute("opacity")).toBe("0.3");
    });

    it("does not show selection overlay when not selected", () => {
      const { container } = renderArrow({ isSelected: false });
      const paths = container.querySelectorAll("path");
      expect(paths).toHaveLength(2); // hit area + arrow only
    });
  });

  // -------------------------------------------------------------------------
  // Null guard — missing positions
  // -------------------------------------------------------------------------

  describe("null guard", () => {
    it("returns null when fromTask position is missing", () => {
      const positions = new Map<string, TaskPosition>();
      positions.set("task-2", { x: 200, y: 46, width: 100, height: 26 });
      const { container } = renderArrow({ taskPositions: positions });
      expect(container.querySelector(".dependency-arrow")).toBeNull();
    });

    it("returns null when toTask position is missing", () => {
      const positions = new Map<string, TaskPosition>();
      positions.set("task-1", { x: 50, y: 10, width: 100, height: 26 });
      const { container } = renderArrow({ taskPositions: positions });
      expect(container.querySelector(".dependency-arrow")).toBeNull();
    });

    it("returns null when both positions are missing", () => {
      const { container } = renderArrow({
        taskPositions: new Map<string, TaskPosition>(),
      });
      expect(container.querySelector(".dependency-arrow")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Mouse interaction
  // -------------------------------------------------------------------------

  describe("mouse interaction", () => {
    it("calls onSelect with dependency id on click", () => {
      const onSelect = vi.fn();
      const { container } = renderArrow({ onSelect });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.click(g);
      expect(onSelect).toHaveBeenCalledWith("dep-1");
    });

    it("stops event propagation on click", () => {
      const { container } = renderArrow();
      const g = container.querySelector(".dependency-arrow")!;
      const event = new MouseEvent("click", { bubbles: true });
      const spy = vi.spyOn(event, "stopPropagation");
      g.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
    });

    it("uses hover color on mouseEnter", () => {
      const { container } = renderArrow({ isSelected: false });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.mouseEnter(g);
      const arrowPath = container.querySelectorAll("path")[1];
      expect(arrowPath.getAttribute("stroke")).toBe(
        COLORS.chart.dependencyHover,
      );
    });

    it("reverts to default color on mouseLeave", () => {
      const { container } = renderArrow({ isSelected: false });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.mouseEnter(g);
      fireEvent.mouseLeave(g);
      const arrowPath = container.querySelectorAll("path")[1];
      expect(arrowPath.getAttribute("stroke")).toBe(
        COLORS.chart.dependencyDefault,
      );
    });

    it("keeps selected color on hover when selected", () => {
      const { container } = renderArrow({ isSelected: true });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.mouseEnter(g);
      const arrowPath = container.querySelectorAll("path")[1];
      expect(arrowPath.getAttribute("stroke")).toBe(
        COLORS.chart.dependencySelected,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Focus visibility (a11y)
  // -------------------------------------------------------------------------

  describe("focus visibility", () => {
    it("has focus-visible outline class instead of inline outline:none", () => {
      const { container } = renderArrow();
      const g = container.querySelector(".dependency-arrow")!;
      expect(g.classList.contains("outline-none")).toBe(true);
      expect(g.classList.contains("focus-visible:outline-blue-500")).toBe(true);
      expect(g.getAttribute("style")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard interaction
  // -------------------------------------------------------------------------

  describe("keyboard interaction", () => {
    it("calls onSelect on Enter key", () => {
      const onSelect = vi.fn();
      const { container } = renderArrow({ onSelect });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.keyDown(g, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith("dep-1");
    });

    it("calls onSelect on Space key", () => {
      const onSelect = vi.fn();
      const { container } = renderArrow({ onSelect });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.keyDown(g, { key: " " });
      expect(onSelect).toHaveBeenCalledWith("dep-1");
    });

    it("calls onDelete on Delete key", () => {
      const onDelete = vi.fn();
      const { container } = renderArrow({ onDelete });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.keyDown(g, { key: "Delete" });
      expect(onDelete).toHaveBeenCalledWith("dep-1");
    });

    it("calls onDelete on Backspace key", () => {
      const onDelete = vi.fn();
      const { container } = renderArrow({ onDelete });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.keyDown(g, { key: "Backspace" });
      expect(onDelete).toHaveBeenCalledWith("dep-1");
    });

    it("deselects on Escape key", () => {
      const onSelect = vi.fn();
      const { container } = renderArrow({ onSelect });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.keyDown(g, { key: "Escape" });
      expect(onSelect).toHaveBeenCalledWith("");
    });

    it("does not call handlers on other keys", () => {
      const onSelect = vi.fn();
      const onDelete = vi.fn();
      const { container } = renderArrow({ onSelect, onDelete });
      const g = container.querySelector(".dependency-arrow")!;
      fireEvent.keyDown(g, { key: "Tab" });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
