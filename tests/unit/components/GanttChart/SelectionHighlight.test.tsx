/**
 * Unit tests for SelectionHighlight component
 * Focus: null guard, correct geometry, design-token usage
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SelectionHighlight } from "../../../../src/components/GanttChart/SelectionHighlight";
import { COLORS } from "../../../../src/styles/design-tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderHighlight(
  rect: { x: number; width: number } | null,
  height = 400,
): ReturnType<typeof render> {
  return render(
    <svg>
      <SelectionHighlight rect={rect} height={height} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SelectionHighlight", () => {
  describe("null guard", () => {
    it("returns null when rect is null", () => {
      const { container } = renderHighlight(null);
      expect(container.querySelector("g")).toBeNull();
    });
  });

  describe("rendering", () => {
    it("renders a group with pointerEvents=none", () => {
      const { container } = renderHighlight({ x: 50, width: 200 });
      const g = container.querySelector("g");
      expect(g).not.toBeNull();
      expect(g!.getAttribute("pointer-events")).toBe("none");
    });

    it("renders a fill rect and two border lines", () => {
      const { container } = renderHighlight({ x: 50, width: 200 });
      const rect = container.querySelector("rect");
      const lines = container.querySelectorAll("line");
      expect(rect).not.toBeNull();
      expect(lines).toHaveLength(2);
    });
  });

  describe("geometry", () => {
    it("fill rect matches provided x, width, and height", () => {
      const { container } = renderHighlight({ x: 100, width: 300 }, 500);
      const rect = container.querySelector("rect")!;
      expect(rect.getAttribute("x")).toBe("100");
      expect(rect.getAttribute("width")).toBe("300");
      expect(rect.getAttribute("height")).toBe("500");
      expect(rect.getAttribute("y")).toBe("0");
    });

    it("left border line is at rect.x", () => {
      const { container } = renderHighlight({ x: 75, width: 150 }, 300);
      const lines = container.querySelectorAll("line");
      const left = lines[0];
      expect(left.getAttribute("x1")).toBe("75");
      expect(left.getAttribute("x2")).toBe("75");
      expect(left.getAttribute("y1")).toBe("0");
      expect(left.getAttribute("y2")).toBe("300");
    });

    it("right border line is at rect.x + rect.width", () => {
      const { container } = renderHighlight({ x: 75, width: 150 }, 300);
      const lines = container.querySelectorAll("line");
      const right = lines[1];
      expect(right.getAttribute("x1")).toBe("225");
      expect(right.getAttribute("x2")).toBe("225");
    });
  });

  describe("design-token colors", () => {
    it("fill rect uses marquee color and opacity from tokens", () => {
      const { container } = renderHighlight({ x: 0, width: 100 });
      const rect = container.querySelector("rect")!;
      expect(rect.getAttribute("fill")).toBe(COLORS.chart.marquee);
      expect(rect.getAttribute("fill-opacity")).toBe(
        String(COLORS.chart.marqueeFillOpacity),
      );
    });

    it("border lines use marquee color", () => {
      const { container } = renderHighlight({ x: 0, width: 100 });
      const lines = container.querySelectorAll("line");
      for (const line of lines) {
        expect(line.getAttribute("stroke")).toBe(COLORS.chart.marquee);
      }
    });

    it("border lines have dashed pattern", () => {
      const { container } = renderHighlight({ x: 0, width: 100 });
      const lines = container.querySelectorAll("line");
      for (const line of lines) {
        expect(line.getAttribute("stroke-dasharray")).toBe("4 2");
      }
    });
  });
});
