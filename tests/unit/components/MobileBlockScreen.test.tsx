/**
 * Unit tests for MobileBlockScreen component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileBlockScreen } from "../../../src/components/MobileBlockScreen";
import { APP_CONFIG } from "../../../src/config/appConfig";

describe("MobileBlockScreen", () => {
  it("renders app name from APP_CONFIG", () => {
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    expect(screen.getByText(APP_CONFIG.name)).toBeInTheDocument();
  });

  it("renders 'Desktop browser required' headline", () => {
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    expect(screen.getByText("Desktop browser required")).toBeInTheDocument();
  });

  it("renders ownchart.app domain", () => {
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    expect(screen.getByText("ownchart.app")).toBeInTheDocument();
  });

  it("calls onDismiss when 'Continue anyway' is clicked", () => {
    const onDismiss = vi.fn();
    render(<MobileBlockScreen onDismiss={onDismiss} />);

    fireEvent.click(screen.getByText("Continue anyway"));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders the logo SVG", () => {
    const { container } = render(<MobileBlockScreen onDismiss={vi.fn()} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("moves focus to the dismiss button on mount", () => {
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    const button = screen.getByRole("button", { name: /continue anyway/i });
    expect(document.activeElement).toBe(button);
  });

  it("keeps focus on the dismiss button when Tab is pressed", async () => {
    const user = userEvent.setup();
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    const button = screen.getByRole("button", { name: /continue anyway/i });

    // Focus starts on the button (from the mount effect)
    button.focus();
    expect(document.activeElement).toBe(button);

    // Tab should be intercepted — focus must remain on the button
    await user.tab();
    expect(document.activeElement).toBe(button);
  });

  it("keeps focus on the dismiss button when Shift+Tab is pressed", async () => {
    const user = userEvent.setup();
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    const button = screen.getByRole("button", { name: /continue anyway/i });

    button.focus();
    expect(document.activeElement).toBe(button);

    // Shift+Tab should also be intercepted
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(button);
  });

  it("has role=dialog with aria-modal and accessible label", () => {
    render(<MobileBlockScreen onDismiss={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // The heading 'Desktop browser required' labels the dialog via aria-labelledby
    const heading = screen.getByText("Desktop browser required");
    expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
  });

  it("calls onDismiss when Escape is pressed on the dismiss button", () => {
    const onDismiss = vi.fn();
    render(<MobileBlockScreen onDismiss={onDismiss} />);
    const button = screen.getByRole("button", { name: /continue anyway/i });
    fireEvent.keyDown(button, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does not call onDismiss for non-Escape/Tab keys on the dismiss button", () => {
    const onDismiss = vi.fn();
    render(<MobileBlockScreen onDismiss={onDismiss} />);
    const button = screen.getByRole("button", { name: /continue anyway/i });
    fireEvent.keyDown(button, { key: "Enter" });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
