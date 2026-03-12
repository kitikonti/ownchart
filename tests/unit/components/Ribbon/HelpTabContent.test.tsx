/**
 * Smoke render tests for HelpTabContent component.
 * Verifies the component mounts and key toolbar buttons are present with
 * correct aria-labels.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpTabContent } from "../../../../src/components/Ribbon/HelpTabContent";
import { useUIStore } from "../../../../src/store/slices/uiSlice";

describe("HelpTabContent", () => {
  const mockOpenHelpPanel = vi.fn();
  const mockOpenAboutDialog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({
      openHelpPanel: mockOpenHelpPanel,
      openAboutDialog: mockOpenAboutDialog,
    } as Parameters<typeof useUIStore.setState>[0]);
  });

  it("renders without crashing", () => {
    const { container } = render(<HelpTabContent />);
    expect(container).toBeTruthy();
  });

  it("renders Help button with correct aria-label", () => {
    render(<HelpTabContent />);
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("renders About button with correct aria-label", () => {
    render(<HelpTabContent />);
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
  });

  it("calls openHelpPanel when Help button is clicked", () => {
    render(<HelpTabContent />);
    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    expect(mockOpenHelpPanel).toHaveBeenCalledTimes(1);
  });

  it("calls openAboutDialog when About button is clicked", () => {
    render(<HelpTabContent />);
    fireEvent.click(screen.getByRole("button", { name: "About" }));
    expect(mockOpenAboutDialog).toHaveBeenCalledTimes(1);
  });
});
