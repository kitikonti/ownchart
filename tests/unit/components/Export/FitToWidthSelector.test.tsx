/**
 * Unit tests for FitToWidthSelector component.
 * Covers preset rendering, custom width toggling, useEffect sync,
 * clamping on custom input, and parent callback wiring.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FitToWidthSelector } from "@/components/Export/FitToWidthSelector";
import {
  DEFAULT_FIT_TO_WIDTH_PX,
  UHD_SCREEN_WIDTH_PX,
  MIN_FIT_WIDTH_PX,
  MAX_FIT_WIDTH_PX,
} from "@/utils/export/types";

function renderComponent(
  overrides: Partial<{
    fitToWidth: number;
    onFitToWidthChange: (w: number) => void;
  }> = {}
) {
  const props = {
    fitToWidth: DEFAULT_FIT_TO_WIDTH_PX,
    onFitToWidthChange: vi.fn(),
    ...overrides,
  };
  const result = render(<FitToWidthSelector {...props} />);
  return { ...result, onChange: props.onFitToWidthChange };
}

describe("FitToWidthSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Preset rendering
  // -------------------------------------------------------------------------

  it("renders the Select element with preset groups", () => {
    renderComponent();
    // The HD Screen preset should be visible in the select
    expect(
      screen.getByRole("combobox")
    ).toBeInTheDocument();
  });

  it("renders the HD Screen option with DEFAULT_FIT_TO_WIDTH_PX value", () => {
    renderComponent();
    // Native select uses <option> elements; query by the option text
    const options = screen.getAllByRole("option") as HTMLOptionElement[];
    const hdOption = options.find((o) =>
      o.textContent?.includes(String(DEFAULT_FIT_TO_WIDTH_PX))
    );
    expect(hdOption).toBeDefined();
    expect(hdOption!.value).toBe(String(DEFAULT_FIT_TO_WIDTH_PX));
  });

  it("renders the 4K Screen option with UHD_SCREEN_WIDTH_PX value", () => {
    renderComponent();
    const options = screen.getAllByRole("option") as HTMLOptionElement[];
    const uhdOption = options.find((o) =>
      o.textContent?.includes(String(UHD_SCREEN_WIDTH_PX))
    );
    expect(uhdOption).toBeDefined();
    expect(uhdOption!.value).toBe(String(UHD_SCREEN_WIDTH_PX));
  });

  it("renders a 'Custom width...' option", () => {
    renderComponent();
    expect(
      screen.getByRole("option", { name: "Custom width..." })
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Preset selection → calls parent, hides custom input
  // -------------------------------------------------------------------------

  it("calls onFitToWidthChange with the selected preset value", () => {
    const onFitToWidthChange = vi.fn();
    renderComponent({ onFitToWidthChange });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: String(UHD_SCREEN_WIDTH_PX) } });

    expect(onFitToWidthChange).toHaveBeenCalledWith(UHD_SCREEN_WIDTH_PX);
  });

  it("does not show the custom input when a preset is active", () => {
    renderComponent({ fitToWidth: DEFAULT_FIT_TO_WIDTH_PX });
    expect(
      screen.queryByRole("spinbutton", { name: "Custom width in pixels" })
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Custom width mode
  // -------------------------------------------------------------------------

  it("shows the custom width input when 'custom' is selected in the dropdown", () => {
    renderComponent();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "custom" } });

    expect(
      screen.getByRole("spinbutton", { name: "Custom width in pixels" })
    ).toBeInTheDocument();
  });

  it("shows the custom width input on initial render when fitToWidth is a non-preset value", () => {
    renderComponent({ fitToWidth: 999 });
    expect(
      screen.getByRole("spinbutton", { name: "Custom width in pixels" })
    ).toBeInTheDocument();
  });

  it("calls onFitToWidthChange with clamped value when custom input is committed (on blur)", () => {
    const onFitToWidthChange = vi.fn();
    renderComponent({ fitToWidth: 999, onFitToWidthChange });

    const input = screen.getByRole("spinbutton", { name: "Custom width in pixels" });
    // The component uses a local draft state: change updates the draft (no
    // parent callback yet), blur commits the clamped value to the parent.
    fireEvent.change(input, { target: { value: "500" } });
    expect(onFitToWidthChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onFitToWidthChange).toHaveBeenCalledWith(500);
  });

  it("clamps custom input above MAX_FIT_WIDTH_PX to MAX_FIT_WIDTH_PX on blur", () => {
    const onFitToWidthChange = vi.fn();
    renderComponent({ fitToWidth: 999, onFitToWidthChange });

    const input = screen.getByRole("spinbutton", { name: "Custom width in pixels" });
    fireEvent.change(input, { target: { value: "99999" } });
    fireEvent.blur(input);

    expect(onFitToWidthChange).toHaveBeenCalledWith(MAX_FIT_WIDTH_PX);
  });

  it("clamps custom input below MIN_FIT_WIDTH_PX to MIN_FIT_WIDTH_PX on blur", () => {
    const onFitToWidthChange = vi.fn();
    renderComponent({ fitToWidth: 999, onFitToWidthChange });

    const input = screen.getByRole("spinbutton", { name: "Custom width in pixels" });
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.blur(input);

    expect(onFitToWidthChange).toHaveBeenCalledWith(MIN_FIT_WIDTH_PX);
  });

  it("falls back to DEFAULT_FIT_TO_WIDTH_PX when custom input is non-numeric (committed on blur)", () => {
    const onFitToWidthChange = vi.fn();
    renderComponent({ fitToWidth: 999, onFitToWidthChange });

    const input = screen.getByRole("spinbutton", { name: "Custom width in pixels" });
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);

    expect(onFitToWidthChange).toHaveBeenCalledWith(DEFAULT_FIT_TO_WIDTH_PX);
  });

  // -------------------------------------------------------------------------
  // useEffect sync: parent resets fitToWidth to a preset value
  // -------------------------------------------------------------------------

  it("hides the custom input when fitToWidth prop is updated to a preset value", () => {
    const { rerender } = renderComponent({ fitToWidth: 999 });
    // Initially in custom mode
    expect(
      screen.getByRole("spinbutton", { name: "Custom width in pixels" })
    ).toBeInTheDocument();

    // Parent resets to a known preset
    rerender(
      <FitToWidthSelector
        fitToWidth={DEFAULT_FIT_TO_WIDTH_PX}
        onFitToWidthChange={vi.fn()}
      />
    );

    expect(
      screen.queryByRole("spinbutton", { name: "Custom width in pixels" })
    ).not.toBeInTheDocument();
  });
});
