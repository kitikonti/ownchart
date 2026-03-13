/**
 * Unit tests for HiddenRowIndicator component.
 * Verifies rendering, hover interactions, and keyboard accessibility.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HiddenRowIndicator } from "@/components/TaskList/HiddenRowIndicator";

vi.mock("../../../src/store/slices/userPreferencesSlice", () => ({
  useDensityConfig: vi.fn(() => ({ rowHeight: 36 })),
}));

describe("HiddenRowIndicator", () => {
  const defaultProps = {
    indicatorColor: "#3b82f6",
    controlsColor: "#3b82f6",
    onUnhide: vi.fn(),
    hiddenCount: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the double-line indicator", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    const indicator = container.querySelector(".pointer-events-none");
    expect(indicator).toBeInTheDocument();
  });

  it("renders hover zone when onUnhide is provided", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    expect(container.querySelector("[data-unhide-zone]")).toBeInTheDocument();
  });

  it("does not render hover zone when onUnhide is not provided", () => {
    const { container } = render(
      <HiddenRowIndicator indicatorColor="#3b82f6" />
    );
    expect(
      container.querySelector("[data-unhide-zone]")
    ).not.toBeInTheDocument();
  });

  it("shows unhide button on mouse enter", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    const hoverZone = container.querySelector("[data-unhide-zone]")!;

    fireEvent.mouseEnter(hoverZone);

    expect(
      screen.getByRole("button", { name: "Unhide 3 hidden rows" })
    ).toBeInTheDocument();
  });

  it("hides unhide button when mouse leaves to outside the zone", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    const hoverZone = container.querySelector("[data-unhide-zone]")!;

    fireEvent.mouseEnter(hoverZone);
    expect(
      screen.getByRole("button", { name: "Unhide 3 hidden rows" })
    ).toBeInTheDocument();

    fireEvent.mouseLeave(hoverZone, { relatedTarget: document.body });
    expect(
      screen.queryByRole("button", { name: "Unhide 3 hidden rows" })
    ).not.toBeInTheDocument();
  });

  it("calls onUnhide when button is clicked", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    const hoverZone = container.querySelector("[data-unhide-zone]")!;

    fireEvent.mouseEnter(hoverZone);
    fireEvent.click(screen.getByRole("button", { name: "Unhide 3 hidden rows" }));

    expect(defaultProps.onUnhide).toHaveBeenCalledOnce();
  });

  it("calls onUnhide on Enter key", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    const hoverZone = container.querySelector("[data-unhide-zone]")!;

    fireEvent.mouseEnter(hoverZone);
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Unhide 3 hidden rows" }),
      { key: "Enter" }
    );

    expect(defaultProps.onUnhide).toHaveBeenCalledOnce();
  });

  it("calls onUnhide on Space key", () => {
    const { container } = render(<HiddenRowIndicator {...defaultProps} />);
    const hoverZone = container.querySelector("[data-unhide-zone]")!;

    fireEvent.mouseEnter(hoverZone);
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Unhide 3 hidden rows" }),
      { key: " " }
    );

    expect(defaultProps.onUnhide).toHaveBeenCalledOnce();
  });

  it("shows zero count in aria-label when hiddenCount is not provided", () => {
    const { container } = render(
      <HiddenRowIndicator
        indicatorColor="#3b82f6"
        controlsColor="#3b82f6"
        onUnhide={vi.fn()}
      />
    );
    const hoverZone = container.querySelector("[data-unhide-zone]")!;

    fireEvent.mouseEnter(hoverZone);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Unhide 0 hidden rows"
    );
  });

  it("does not require controlsColor when onUnhide is not provided", () => {
    expect(() =>
      render(<HiddenRowIndicator indicatorColor="#3b82f6" />)
    ).not.toThrow();
  });
});
