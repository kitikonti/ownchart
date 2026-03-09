/**
 * Unit tests for ZoomDialog component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ZoomDialog } from "../../../../src/components/StatusBar/ZoomDialog";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  currentZoom: 1.0,
  onSelect: vi.fn(),
};

describe("ZoomDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<ZoomDialog {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders all zoom presets when open", () => {
    render(<ZoomDialog {...defaultProps} />);

    expect(screen.getByText("Fit to View")).toBeInTheDocument();
    expect(screen.getByText("200%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("pre-selects the radio matching currentZoom exactly", () => {
    render(<ZoomDialog {...defaultProps} currentZoom={1.0} />);

    const radios = screen.getAllByRole("radio");
    const checked = radios.find((r) => (r as HTMLInputElement).checked);
    expect(checked).toBeDefined();
    expect((checked as HTMLInputElement).value).toBe("1");
  });

  it("pre-selects the nearest preset when currentZoom has no exact match", () => {
    // 0.8 is between 0.75 and 1.0; nearest is 0.75
    render(<ZoomDialog {...defaultProps} currentZoom={0.8} />);

    const radios = screen.getAllByRole("radio");
    const checked = radios.find((r) => (r as HTMLInputElement).checked);
    expect(checked).toBeDefined();
    expect((checked as HTMLInputElement).value).toBe("0.75");
  });

  it("renders OK and Cancel buttons", () => {
    render(<ZoomDialog {...defaultProps} />);

    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onSelect with selected value when OK is clicked", () => {
    render(<ZoomDialog {...defaultProps} currentZoom={1.0} />);

    fireEvent.click(screen.getByText("OK"));

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(1.0);
  });

  it("calls onClose when Cancel is clicked without calling onSelect", () => {
    render(<ZoomDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
  });

  it("updates selected value when a different radio is clicked", () => {
    render(<ZoomDialog {...defaultProps} currentZoom={1.0} />);

    // Click the 50% radio
    const fiftyPercent = screen.getByDisplayValue("0.5");
    fireEvent.click(fiftyPercent);

    // Confirm OK sends the newly selected value
    fireEvent.click(screen.getByText("OK"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(0.5);
  });

  it("calls onSelect with 'fit' when Fit to View is selected and OK clicked", () => {
    render(<ZoomDialog {...defaultProps} />);

    const fitRadio = screen.getByDisplayValue("fit");
    fireEvent.click(fitRadio);

    fireEvent.click(screen.getByText("OK"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("fit");
  });

  it("resets selection to currentZoom when dialog re-opens", () => {
    const { rerender } = render(
      <ZoomDialog {...defaultProps} isOpen={false} currentZoom={0.5} />
    );

    // Open the dialog with a different zoom
    rerender(
      <ZoomDialog {...defaultProps} isOpen={true} currentZoom={0.5} />
    );

    const radios = screen.getAllByRole("radio");
    const checked = radios.find((r) => (r as HTMLInputElement).checked);
    expect((checked as HTMLInputElement).value).toBe("0.5");
  });

  it("pre-selects Fit to View when currentZoom is 'fit'", () => {
    render(<ZoomDialog {...defaultProps} currentZoom="fit" />);

    const fitRadio = screen.getByDisplayValue("fit");
    expect((fitRadio as HTMLInputElement).checked).toBe(true);
  });

  it("pressing Enter inside the radio group calls onSelect", () => {
    render(<ZoomDialog {...defaultProps} currentZoom={1.0} />);

    const radioGroup = screen.getByRole("radiogroup");
    fireEvent.keyDown(radioGroup, { key: "Enter" });

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(1.0);
  });

  it("radio inputs have explicit id and label has matching htmlFor", () => {
    render(<ZoomDialog {...defaultProps} />);

    // Every radio should have an id, and each label's htmlFor should match
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    for (const radio of radios) {
      expect(radio.id).toBeTruthy();
      const label = document.querySelector(`label[for="${radio.id}"]`);
      expect(label).not.toBeNull();
    }
  });
});
