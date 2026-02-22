/**
 * Unit tests for ColorDropdown component
 * Focus: mode selection, options panel rendering, store interactions,
 * Apply Colors to Manual visibility, ARIA attributes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ColorDropdown } from "../../../../src/components/Ribbon/ColorDropdown";
import { DEFAULT_COLOR_MODE_STATE } from "../../../../src/config/colorModeDefaults";
import type { ColorModeState } from "../../../../src/types/colorMode.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetColorMode = vi.fn();
const mockSetThemeOptions = vi.fn();
const mockSetSummaryOptions = vi.fn();
const mockSetTaskTypeOptions = vi.fn();
const mockSetHierarchyOptions = vi.fn();
const mockApplyColorsToManual = vi.fn();
const mockToggle = vi.fn();
const mockClose = vi.fn();

let mockColorModeState: ColorModeState = { ...DEFAULT_COLOR_MODE_STATE };
let mockIsOpen = false;

vi.mock("../../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      colorModeState: mockColorModeState,
      setColorMode: mockSetColorMode,
      setThemeOptions: mockSetThemeOptions,
      setSummaryOptions: mockSetSummaryOptions,
      setTaskTypeOptions: mockSetTaskTypeOptions,
      setHierarchyOptions: mockSetHierarchyOptions,
      applyColorsToManual: mockApplyColorsToManual,
    })
  ),
}));

vi.mock("../../../../src/hooks/useDropdown", () => ({
  useDropdown: vi.fn(() => ({
    isOpen: mockIsOpen,
    setIsOpen: vi.fn(),
    toggle: mockToggle,
    close: mockClose,
    containerRef: { current: null },
    triggerProps: {
      onClick: mockToggle,
      "aria-haspopup": "true" as const,
      "aria-expanded": mockIsOpen,
    },
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDropdown(): ReturnType<typeof render> {
  return render(<ColorDropdown />);
}

function renderOpenDropdown(
  mode: ColorModeState["mode"] = "manual"
): ReturnType<typeof render> {
  mockIsOpen = true;
  mockColorModeState = { ...DEFAULT_COLOR_MODE_STATE, mode };
  return render(<ColorDropdown />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ColorDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockColorModeState = { ...DEFAULT_COLOR_MODE_STATE };
    mockIsOpen = false;
  });

  describe("closed state", () => {
    it("renders trigger button with Color label", () => {
      const { container } = renderDropdown();
      expect(container.textContent).toContain("Color");
    });

    it("does not render dropdown panel when closed", () => {
      const { container } = renderDropdown();
      expect(container.querySelector(".dropdown-panel")).toBeNull();
    });
  });

  describe("open state — mode selection", () => {
    it("renders all 5 color mode options", () => {
      const { container } = renderOpenDropdown();
      const text = container.textContent || "";
      expect(text).toContain("None");
      expect(text).toContain("Theme");
      expect(text).toContain("Summary Group");
      expect(text).toContain("Task Type");
      expect(text).toContain("Hierarchy");
    });

    it("shows descriptions for each mode", () => {
      const { container } = renderOpenDropdown();
      const text = container.textContent || "";
      expect(text).toContain("No automatic coloring");
      expect(text).toContain("One-click palette themes");
      expect(text).toContain("Children inherit parent color");
      expect(text).toContain("Color by Summary/Task/Milestone");
    });

    it("calls setColorMode when a mode is clicked", () => {
      const { getByText } = renderOpenDropdown();
      fireEvent.click(getByText("Theme"));
      expect(mockSetColorMode).toHaveBeenCalledWith("theme");
    });

    it("does not close panel on mode selection", () => {
      const { getByText } = renderOpenDropdown();
      fireEvent.click(getByText("Theme"));
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe("manual mode options", () => {
    it("shows manual mode instructions", () => {
      const { container } = renderOpenDropdown("manual");
      expect(container.textContent).toContain(
        "Use the color picker in the task list"
      );
    });

    it("does not show Apply Colors to Manual button", () => {
      const { container } = renderOpenDropdown("manual");
      expect(container.textContent).not.toContain("Apply Colors to Manual");
    });
  });

  describe("theme mode options", () => {
    it("shows palette categories", () => {
      const { container } = renderOpenDropdown("theme");
      const text = container.textContent || "";
      expect(text).toContain("Classic");
      expect(text).toContain("Professional");
      expect(text).toContain("Vibrant");
    });

    it("shows palette names", () => {
      const { container } = renderOpenDropdown("theme");
      const text = container.textContent || "";
      expect(text).toContain("Tableau 10");
      expect(text).toContain("MS Office");
    });

    it("calls setThemeOptions and closes on palette selection", () => {
      const { getByText } = renderOpenDropdown("theme");
      fireEvent.click(getByText("Tableau 10"));
      expect(mockSetThemeOptions).toHaveBeenCalledWith({
        selectedPaletteId: "tableau-10",
        customMonochromeBase: null,
      });
      expect(mockClose).toHaveBeenCalled();
    });

    it("shows Apply Colors to Manual button", () => {
      const { container } = renderOpenDropdown("theme");
      expect(container.textContent).toContain("Apply Colors to Manual");
    });
  });

  describe("summary mode options", () => {
    it("shows summary mode description", () => {
      const { container } = renderOpenDropdown("summary");
      expect(container.textContent).toContain(
        "children inherit automatically"
      );
    });

    it("shows milestone accent checkbox", () => {
      const { container } = renderOpenDropdown("summary");
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      expect(container.textContent).toContain("Milestones in accent color");
    });

    it("shows accent color picker when milestone accent is enabled", () => {
      mockIsOpen = true;
      mockColorModeState = {
        ...DEFAULT_COLOR_MODE_STATE,
        mode: "summary",
        summaryOptions: {
          useMilestoneAccent: true,
          milestoneAccentColor: "#CA8A04",
        },
      };
      const { container } = render(<ColorDropdown />);
      const colorInput = container.querySelector(
        'input[aria-label="Milestone accent color"]'
      );
      expect(colorInput).not.toBeNull();
    });
  });

  describe("taskType mode options", () => {
    it("shows color pickers for all three task types", () => {
      const { container } = renderOpenDropdown("taskType");
      expect(
        container.querySelector('input[aria-label="Summary color"]')
      ).not.toBeNull();
      expect(
        container.querySelector('input[aria-label="Task color"]')
      ).not.toBeNull();
      expect(
        container.querySelector('input[aria-label="Milestone color"]')
      ).not.toBeNull();
    });
  });

  describe("hierarchy mode options", () => {
    it("shows base color picker and range sliders", () => {
      const { container } = renderOpenDropdown("hierarchy");
      expect(
        container.querySelector('input[aria-label="Base Color color"]')
      ).not.toBeNull();
      expect(
        container.querySelector('input[aria-label="Lighten per level"]')
      ).not.toBeNull();
      expect(
        container.querySelector('input[aria-label="Max lighten"]')
      ).not.toBeNull();
    });

    it("displays current slider values", () => {
      const { container } = renderOpenDropdown("hierarchy");
      const text = container.textContent || "";
      expect(text).toContain("12%");
      expect(text).toContain("36%");
    });
  });

  describe("Apply Colors to Manual", () => {
    it("calls applyColorsToManual and closes dropdown", () => {
      const { getByText } = renderOpenDropdown("theme");
      fireEvent.click(getByText("Apply Colors to Manual"));
      expect(mockApplyColorsToManual).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    it("is hidden in manual mode", () => {
      const { container } = renderOpenDropdown("manual");
      expect(container.textContent).not.toContain("Apply Colors to Manual");
    });

    it("is visible in all auto modes", () => {
      for (const mode of [
        "theme",
        "summary",
        "taskType",
        "hierarchy",
      ] as const) {
        const { container, unmount } = renderOpenDropdown(mode);
        expect(container.textContent).toContain("Apply Colors to Manual");
        unmount();
      }
    });
  });

  describe("ARIA attributes", () => {
    it("has aria-haspopup=dialog on trigger", () => {
      const { container } = renderDropdown();
      const trigger = container.querySelector('[aria-haspopup="dialog"]');
      expect(trigger).not.toBeNull();
    });

    it("has descriptive aria-label on trigger", () => {
      const { container } = renderDropdown();
      const trigger = container.querySelector(
        '[aria-label="Color mode and options"]'
      );
      expect(trigger).not.toBeNull();
    });
  });
});
