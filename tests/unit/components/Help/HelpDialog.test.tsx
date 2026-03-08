import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  describe("tab accessibility", () => {
    it("should have correct ARIA attributes on tabs", () => {
      useUIStore.setState({ isHelpPanelOpen: true });
      render(<HelpDialog />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);

      // Active tab has aria-selected=true and tabIndex=0
      const activeTab = tabs.find((t) => t.getAttribute("aria-selected") === "true");
      expect(activeTab).toBeTruthy();
      expect(activeTab).toHaveAttribute("tabindex", "0");

      // Inactive tabs have tabIndex=-1
      const inactiveTabs = tabs.filter((t) => t.getAttribute("aria-selected") === "false");
      inactiveTabs.forEach((tab) => {
        expect(tab).toHaveAttribute("tabindex", "-1");
      });
    });

    it("should navigate to next tab with ArrowRight", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "getting-started",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowRight" });

      expect(useUIStore.getState().helpDialogActiveTab).toBe("shortcuts");
    });

    it("should navigate to previous tab with ArrowLeft", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "shortcuts",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });

      expect(useUIStore.getState().helpDialogActiveTab).toBe("getting-started");
    });

    it("should wrap ArrowRight from last tab to first", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "features",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowRight" });

      expect(useUIStore.getState().helpDialogActiveTab).toBe("getting-started");
    });

    it("should wrap ArrowLeft from first tab to last", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "getting-started",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });

      expect(useUIStore.getState().helpDialogActiveTab).toBe("features");
    });

    it("should jump to first tab with Home key", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "features",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "Home" });

      expect(useUIStore.getState().helpDialogActiveTab).toBe("getting-started");
    });

    it("should jump to last tab with End key", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "getting-started",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "End" });

      expect(useUIStore.getState().helpDialogActiveTab).toBe("features");
    });

    it("should not respond to other keys in tablist", () => {
      useUIStore.setState({
        isHelpPanelOpen: true,
        helpDialogActiveTab: "getting-started",
      });
      render(<HelpDialog />);

      const tablist = screen.getByRole("tablist");
      fireEvent.keyDown(tablist, { key: "Enter" });

      // Tab should not change
      expect(useUIStore.getState().helpDialogActiveTab).toBe("getting-started");
    });
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
