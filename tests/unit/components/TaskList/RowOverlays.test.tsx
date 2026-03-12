/**
 * Unit tests for RowOverlays component.
 * Verifies conditional rendering of selection and clipboard overlays.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RowOverlays } from "../../../../src/components/TaskList/RowOverlays";
import { SELECTION_RADIUS } from "../../../../src/components/TaskList/rowNumberConfig";
import type {
  SelectionPosition,
  ClipboardPosition,
} from "../../../../src/hooks/useTaskRowData";

// jsdom normalises `border-top: none` to an empty string — helper to distinguish
// "has a real border" from "border is none/unset".
function hasBorder(styleValue: string): boolean {
  return styleValue !== "" && styleValue !== "none";
}

describe("RowOverlays", () => {
  it("renders nothing when neither selectionPosition nor clipboardPosition is provided", () => {
    const { container } = render(<RowOverlays />);
    expect(container.firstChild).toBeNull();
  });

  it("renders selection overlay when selectionPosition is provided", () => {
    const selectionPosition: SelectionPosition = {
      isFirstSelected: true,
      isLastSelected: true,
    };
    const { container } = render(
      <RowOverlays selectionPosition={selectionPosition} />
    );
    // Should render the fragment with one overlay div
    expect(container.querySelector("div")).not.toBeNull();
  });

  it("renders clipboard overlay when clipboardPosition is provided", () => {
    const clipboardPosition: ClipboardPosition = {
      isFirst: true,
      isLast: true,
    };
    const { container } = render(
      <RowOverlays clipboardPosition={clipboardPosition} />
    );
    expect(container.querySelector("div")).not.toBeNull();
  });

  it("renders both overlays when both props are provided", () => {
    const selectionPosition: SelectionPosition = {
      isFirstSelected: true,
      isLastSelected: true,
    };
    const clipboardPosition: ClipboardPosition = {
      isFirst: true,
      isLast: true,
    };
    const { container } = render(
      <RowOverlays
        selectionPosition={selectionPosition}
        clipboardPosition={clipboardPosition}
      />
    );
    const overlays = container.querySelectorAll("div");
    expect(overlays).toHaveLength(2);
  });

  describe("selection overlay border logic", () => {
    it("applies top border when isFirstSelected is true", () => {
      const selectionPosition: SelectionPosition = {
        isFirstSelected: true,
        isLastSelected: false,
      };
      const { container } = render(
        <RowOverlays selectionPosition={selectionPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderTop)).toBe(true);
    });

    it("omits top border when isFirstSelected is false", () => {
      const selectionPosition: SelectionPosition = {
        isFirstSelected: false,
        isLastSelected: true,
      };
      const { container } = render(
        <RowOverlays selectionPosition={selectionPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderTop)).toBe(false);
    });

    it("applies bottom border when isLastSelected is true", () => {
      const selectionPosition: SelectionPosition = {
        isFirstSelected: false,
        isLastSelected: true,
      };
      const { container } = render(
        <RowOverlays selectionPosition={selectionPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderBottom)).toBe(true);
    });

    it("omits bottom border when isLastSelected is false", () => {
      const selectionPosition: SelectionPosition = {
        isFirstSelected: true,
        isLastSelected: false,
      };
      const { container } = render(
        <RowOverlays selectionPosition={selectionPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderBottom)).toBe(false);
    });

    it("applies SELECTION_RADIUS to top-left when isFirstSelected", () => {
      const selectionPosition: SelectionPosition = {
        isFirstSelected: true,
        isLastSelected: false,
      };
      const { container } = render(
        <RowOverlays selectionPosition={selectionPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(overlay.style.borderRadius).toContain(SELECTION_RADIUS);
    });
  });

  describe("clipboard overlay border logic", () => {
    it("applies top border when isFirst is true", () => {
      const clipboardPosition: ClipboardPosition = {
        isFirst: true,
        isLast: false,
      };
      const { container } = render(
        <RowOverlays clipboardPosition={clipboardPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderTop)).toBe(true);
    });

    it("omits top border when isFirst is false", () => {
      const clipboardPosition: ClipboardPosition = {
        isFirst: false,
        isLast: true,
      };
      const { container } = render(
        <RowOverlays clipboardPosition={clipboardPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderTop)).toBe(false);
    });

    it("applies bottom border when isLast is true", () => {
      const clipboardPosition: ClipboardPosition = {
        isFirst: false,
        isLast: true,
      };
      const { container } = render(
        <RowOverlays clipboardPosition={clipboardPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderBottom)).toBe(true);
    });

    it("omits bottom border when isLast is false", () => {
      const clipboardPosition: ClipboardPosition = {
        isFirst: true,
        isLast: false,
      };
      const { container } = render(
        <RowOverlays clipboardPosition={clipboardPosition} />
      );
      const overlay = container.querySelector("div") as HTMLElement;
      expect(hasBorder(overlay.style.borderBottom)).toBe(false);
    });
  });
});
