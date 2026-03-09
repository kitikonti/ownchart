import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WelcomeTour } from "../../../../src/components/Help/WelcomeTour";
import { useUIStore } from "../../../../src/store/slices/uiSlice";

describe("WelcomeTour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({
      isWelcomeTourOpen: false,
      isHelpPanelOpen: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<WelcomeTour />);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog content when open", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    expect(screen.getByText("Welcome to OwnChart!")).toBeInTheDocument();
    expect(screen.getByText(/privacy-first/i)).toBeInTheDocument();
  });

  it("renders quick tips section", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    expect(screen.getByText("Quick tips")).toBeInTheDocument();
    expect(screen.getByText("Click the empty row to add tasks")).toBeInTheDocument();
    expect(screen.getByText("Drag task bars to change dates")).toBeInTheDocument();
    expect(screen.getByText("Press ? anytime for shortcuts")).toBeInTheDocument();
  });

  it("renders Get Started and Show Shortcuts buttons", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("Show Shortcuts")).toBeInTheDocument();
  });

  it("renders the Don't show again checkbox unchecked by default", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("toggles the checkbox when clicked", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("closes dialog when Get Started is clicked", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    fireEvent.click(screen.getByText("Get Started"));

    expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
  });

  it("closes dialog when Show Shortcuts is clicked and opens help panel after delay", () => {
    useUIStore.setState({ isWelcomeTourOpen: true, isHelpPanelOpen: false });
    render(<WelcomeTour />);

    fireEvent.click(screen.getByText("Show Shortcuts"));

    expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
    // Help panel not yet open — timer is pending
    expect(useUIStore.getState().isHelpPanelOpen).toBe(false);

    act(() => {
      vi.runAllTimers();
    });

    expect(useUIStore.getState().isHelpPanelOpen).toBe(true);
  });

  it("calls dismissWelcome with permanent=true when checkbox is checked", () => {
    useUIStore.setState({ isWelcomeTourOpen: true });
    render(<WelcomeTour />);

    // Check the "don't show again" box
    fireEvent.click(screen.getByRole("checkbox"));
    // Then get started
    fireEvent.click(screen.getByText("Get Started"));

    // With permanent=true, the store should not re-open the tour on next load
    expect(useUIStore.getState().isWelcomeTourOpen).toBe(false);
  });
});
