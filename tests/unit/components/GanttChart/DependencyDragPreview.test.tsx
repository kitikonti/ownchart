/**
 * Unit tests for DependencyDragPreview component
 * Focus: magic number → constant extraction, correct SVG elements, design-token usage
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { DependencyDragPreview } from "../../../../src/components/GanttChart/DependencyDragPreview";
import { COLORS } from "../../../../src/styles/design-tokens";

// ---------------------------------------------------------------------------
// Mock arrowPath utils
// ---------------------------------------------------------------------------

vi.mock("../../../../src/utils/arrowPath", () => ({
  ARROWHEAD_SIZE: 8,
  calculateDragPath: vi.fn(() => "M 10 20 C 55 20 55 80 100 80"),
  getArrowheadPoints: vi.fn((size: number) => `0,${-size} ${size},0 0,${size}`),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPreview(
  overrides: Partial<Parameters<typeof DependencyDragPreview>[0]> = {},
): ReturnType<typeof render> {
  const defaults = { startX: 10, startY: 20, endX: 100, endY: 80 };
  return render(
    <svg>
      <DependencyDragPreview {...defaults} {...overrides} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DependencyDragPreview", () => {
  describe("rendering", () => {
    it("renders a group with class dependency-drag-preview", () => {
      const { container } = renderPreview();
      expect(
        container.querySelector(".dependency-drag-preview"),
      ).not.toBeNull();
    });

    it("renders preview path, arrowhead polygon, and start circle", () => {
      const { container } = renderPreview();
      const path = container.querySelector("path");
      const polygon = container.querySelector("polygon");
      const circle = container.querySelector("circle");
      expect(path).not.toBeNull();
      expect(polygon).not.toBeNull();
      expect(circle).not.toBeNull();
    });

    it("sets pointerEvents=none on root group", () => {
      const { container } = renderPreview();
      const g = container.querySelector(".dependency-drag-preview");
      expect(g!.getAttribute("pointer-events")).toBe("none");
    });
  });

  describe("design-token colors", () => {
    it("uses dependencySelected color for path stroke", () => {
      const { container } = renderPreview();
      const path = container.querySelector("path");
      expect(path!.getAttribute("stroke")).toBe(
        COLORS.chart.dependencySelected,
      );
    });

    it("uses dependencySelected color for arrowhead fill", () => {
      const { container } = renderPreview();
      const polygon = container.querySelector("polygon");
      expect(polygon!.getAttribute("fill")).toBe(
        COLORS.chart.dependencySelected,
      );
    });

    it("uses dependencySelected color for start circle fill", () => {
      const { container } = renderPreview();
      const circle = container.querySelector("circle");
      expect(circle!.getAttribute("fill")).toBe(
        COLORS.chart.dependencySelected,
      );
    });
  });

  describe("geometry constants", () => {
    it("path has dashed stroke pattern", () => {
      const { container } = renderPreview();
      const path = container.querySelector("path");
      expect(path!.getAttribute("stroke-dasharray")).toBe("6 4");
    });

    it("path has correct opacity", () => {
      const { container } = renderPreview();
      const path = container.querySelector("path");
      expect(path!.getAttribute("opacity")).toBe("0.8");
    });

    it("start circle has correct radius", () => {
      const { container } = renderPreview();
      const circle = container.querySelector("circle");
      expect(circle!.getAttribute("r")).toBe("5");
    });

    it("start circle is positioned at startX/startY", () => {
      const { container } = renderPreview({ startX: 42, startY: 99 });
      const circle = container.querySelector("circle");
      expect(circle!.getAttribute("cx")).toBe("42");
      expect(circle!.getAttribute("cy")).toBe("99");
    });

    it("arrowhead transform includes endX/endY and computed angle", () => {
      const { container } = renderPreview({
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
      });
      const polygon = container.querySelector("polygon");
      const transform = polygon!.getAttribute("transform")!;
      expect(transform).toContain("translate(100, 0)");
      // atan2(0, 100) = 0°
      expect(transform).toContain("rotate(0)");
    });
  });
});
