/**
 * Unit tests for CustomZoomControl component.
 * Covers preset rendering, slider/input interactions, clamping, and
 * the isPngOrSvg flag that enables finer zoom presets.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomZoomControl } from "../../../../src/components/Export/CustomZoomControl";
import {
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_PRESETS,
} from "../../../../src/utils/export/types";

const DEFAULT_ZOOM = 1.0;

function renderComponent(
  overrides: Partial<{
    timelineZoom: number;
    isPngOrSvg: boolean;
    onTimelineZoomChange: (z: number) => void;
  }> = {}
) {
  const props = {
    timelineZoom: DEFAULT_ZOOM,
    onTimelineZoomChange: vi.fn(),
    isPngOrSvg: false,
    ...overrides,
  };
  const result = render(<CustomZoomControl {...props} />);
  return { ...result, onChange: props.onTimelineZoomChange };
}

describe("CustomZoomControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Preset buttons
  // -------------------------------------------------------------------------

  it("renders the standard EXPORT_ZOOM_PRESETS buttons when isPngOrSvg is false", () => {
    renderComponent({ isPngOrSvg: false });
    const presetValues = Object.values(EXPORT_ZOOM_PRESETS);
    presetValues.forEach((value) => {
      expect(
        screen.getByRole("button", {
          name: `Set zoom to ${Math.round(value * 100)}%`,
        })
      ).toBeInTheDocument();
    });
  });

  it("includes the 10% and 25% fine-grain presets when isPngOrSvg is true", () => {
    renderComponent({ isPngOrSvg: true });
    expect(
      screen.getByRole("button", { name: "Set zoom to 10%" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Set zoom to 25%" })
    ).toBeInTheDocument();
  });

  it("calls onTimelineZoomChange with the preset value when a preset button is clicked", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange, isPngOrSvg: false });

    const targetPreset = EXPORT_ZOOM_PRESETS.COMPACT; // 0.5
    fireEvent.click(
      screen.getByRole("button", {
        name: `Set zoom to ${Math.round(targetPreset * 100)}%`,
      })
    );

    expect(onTimelineZoomChange).toHaveBeenCalledWith(targetPreset);
  });

  it("marks the currently active preset button as aria-pressed=true", () => {
    renderComponent({ timelineZoom: EXPORT_ZOOM_PRESETS.STANDARD, isPngOrSvg: false });
    const activeButton = screen.getByRole("button", { name: "Set zoom to 100%" });
    expect(activeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("marks non-active preset buttons as aria-pressed=false", () => {
    renderComponent({ timelineZoom: EXPORT_ZOOM_PRESETS.STANDARD, isPngOrSvg: false });
    const inactiveButton = screen.getByRole("button", { name: "Set zoom to 50%" });
    expect(inactiveButton).toHaveAttribute("aria-pressed", "false");
  });

  // -------------------------------------------------------------------------
  // Slider
  // -------------------------------------------------------------------------

  it("renders the zoom range slider", () => {
    renderComponent();
    expect(screen.getByRole("slider", { name: "Zoom level" })).toBeInTheDocument();
  });

  it("calls onTimelineZoomChange when the slider changes", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange });

    const slider = screen.getByRole("slider", { name: "Zoom level" });
    fireEvent.change(slider, { target: { value: "150" } });

    expect(onTimelineZoomChange).toHaveBeenCalledWith(1.5);
  });

  // -------------------------------------------------------------------------
  // Zoom percentage input (clamping)
  // -------------------------------------------------------------------------

  it("renders the zoom percentage input", () => {
    renderComponent();
    expect(screen.getByRole("spinbutton", { name: "Zoom percentage" })).toBeInTheDocument();
  });

  it("passes the zoom percentage value rounded to the nearest integer", () => {
    renderComponent({ timelineZoom: 1.0 });
    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    expect(input).toHaveValue(100);
  });

  it("does not call onTimelineZoomChange while typing (deferred commit)", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange });

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    fireEvent.change(input, { target: { value: "15" } });

    // No callback until the user confirms (blur or Enter)
    expect(onTimelineZoomChange).not.toHaveBeenCalled();
  });

  it("clamps zoom input to EXPORT_ZOOM_MAX when the entered value exceeds it (committed on blur)", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange });

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    fireEvent.change(input, { target: { value: "99999" } });
    fireEvent.blur(input);

    expect(onTimelineZoomChange).toHaveBeenCalledWith(EXPORT_ZOOM_MAX);
  });

  it("clamps zoom input to EXPORT_ZOOM_MIN when the entered value is below it (committed on blur)", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange });

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    // Enter a value below the minimum (EXPORT_ZOOM_MIN * 100 = 5%)
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.blur(input);

    expect(onTimelineZoomChange).toHaveBeenCalledWith(EXPORT_ZOOM_MIN);
  });

  it("falls back to 100% (1.0) when the percentage input receives an empty/non-numeric value (committed on blur)", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange });

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onTimelineZoomChange).toHaveBeenCalledWith(1.0);
  });

  it("commits the zoom value on Enter key press", () => {
    const onTimelineZoomChange = vi.fn();
    renderComponent({ onTimelineZoomChange });

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // Pressing Enter triggers blur which commits the value
    fireEvent.blur(input);

    expect(onTimelineZoomChange).toHaveBeenCalledWith(1.5);
  });
});
