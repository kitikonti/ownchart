/**
 * Unit tests for MobileBlockScreen component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
