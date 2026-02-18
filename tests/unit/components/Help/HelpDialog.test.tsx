import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpDialog } from "../../../../src/components/Help/HelpDialog";
import { useUIStore } from "../../../../src/store/slices/uiSlice";

describe("HelpDialog", () => {
  beforeEach(() => {
    useUIStore.setState({
      isHelpPanelOpen: false,
      helpDialogActiveTab: "getting-started",
    });
  });

  it("should not render when closed", () => {
    render(<HelpDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show Help title", () => {
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);
    expect(screen.getByText("Help")).toBeInTheDocument();
  });

  it("should render all three tabs", () => {
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("should render search input", () => {
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);
    expect(
      screen.getByPlaceholderText("Search help topics...")
    ).toBeInTheDocument();
  });

  it("should show Getting Started tab by default", () => {
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);
    // Getting started shows card-style items
    expect(screen.getByText("Creating Your First Task")).toBeInTheDocument();
  });

  it("should switch to Shortcuts tab", async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);

    await user.click(screen.getByText("Shortcuts"));
    expect(useUIStore.getState().helpDialogActiveTab).toBe("shortcuts");
  });

  it("should switch to Features tab", async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);

    await user.click(screen.getByText("Features"));
    expect(useUIStore.getState().helpDialogActiveTab).toBe("features");
  });

  it("should show Done button in footer", () => {
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should close when Done is clicked", async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isHelpPanelOpen: true });
    render(<HelpDialog />);

    await user.click(screen.getByText("Done"));
    expect(useUIStore.getState().isHelpPanelOpen).toBe(false);
  });

  describe("search", () => {
    it("should hide tabs and show results when searching", async () => {
      const user = userEvent.setup();
      useUIStore.setState({ isHelpPanelOpen: true });
      render(<HelpDialog />);

      const input = screen.getByPlaceholderText("Search help topics...");
      await user.type(input, "undo");

      // Tab bar should be hidden (tab buttons no longer in role=tab)
      const tabButtons = screen.queryAllByRole("tab");
      expect(tabButtons).toHaveLength(0);

      // Results should appear
      expect(screen.getByText(/result/)).toBeInTheDocument();
    });

    it("should show no results message for nonsense query", async () => {
      const user = userEvent.setup();
      useUIStore.setState({ isHelpPanelOpen: true });
      render(<HelpDialog />);

      const input = screen.getByPlaceholderText("Search help topics...");
      await user.type(input, "xyzzyfoobarbaz123");

      expect(screen.getByText(/No results/)).toBeInTheDocument();
    });
  });
});
