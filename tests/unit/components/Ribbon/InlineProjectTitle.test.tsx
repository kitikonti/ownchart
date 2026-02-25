import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineProjectTitle } from "../../../../src/components/Ribbon/InlineProjectTitle";
import { useChartStore } from "../../../../src/store/slices/chartSlice";
import { useFileStore } from "../../../../src/store/slices/fileSlice";

describe("InlineProjectTitle", () => {
  beforeEach(() => {
    useChartStore.setState({ projectTitle: "" });
    useFileStore.setState({ fileName: null, isDirty: false });
  });

  it("displays 'Untitled' when no project title or filename", () => {
    render(<InlineProjectTitle />);
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("displays project title when set", () => {
    useChartStore.setState({ projectTitle: "My Project" });
    render(<InlineProjectTitle />);
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });

  it("displays filename without .ownchart extension", () => {
    useFileStore.setState({ fileName: "test-plan.ownchart" });
    render(<InlineProjectTitle />);
    expect(screen.getByText("test-plan")).toBeInTheDocument();
  });

  it("prefers projectTitle over fileName", () => {
    useChartStore.setState({ projectTitle: "Custom Title" });
    useFileStore.setState({ fileName: "some-file.ownchart" });
    render(<InlineProjectTitle />);
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("shows dirty indicator when file is dirty", () => {
    useChartStore.setState({ projectTitle: "Test" });
    useFileStore.setState({ isDirty: true });
    render(<InlineProjectTitle />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show dirty indicator when file is clean", () => {
    useChartStore.setState({ projectTitle: "Test" });
    useFileStore.setState({ isDirty: false });
    render(<InlineProjectTitle />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("enters edit mode on click", () => {
    useChartStore.setState({ projectTitle: "My Project" });
    render(<InlineProjectTitle />);

    fireEvent.click(screen.getByText("My Project"));

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("My Project");
  });

  it("saves on Enter key", () => {
    useChartStore.setState({ projectTitle: "Old Title" });
    render(<InlineProjectTitle />);

    fireEvent.click(screen.getByText("Old Title"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(useChartStore.getState().projectTitle).toBe("New Title");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cancels on Escape key without saving", () => {
    useChartStore.setState({ projectTitle: "Original" });
    render(<InlineProjectTitle />);

    fireEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(useChartStore.getState().projectTitle).toBe("Original");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("saves on blur", () => {
    useChartStore.setState({ projectTitle: "Old" });
    render(<InlineProjectTitle />);

    fireEvent.click(screen.getByText("Old"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "  New  " } });
    fireEvent.blur(input);

    // Should trim whitespace
    expect(useChartStore.getState().projectTitle).toBe("New");
  });

  it("enters edit mode when triggerEdit prop is set", () => {
    useChartStore.setState({ projectTitle: "Title" });
    const onEditTriggered = vi.fn();

    render(
      <InlineProjectTitle triggerEdit={true} onEditTriggered={onEditTriggered} />
    );

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(onEditTriggered).toHaveBeenCalledOnce();
  });

  it("has accessible label on input", () => {
    useChartStore.setState({ projectTitle: "Test" });
    render(<InlineProjectTitle />);

    fireEvent.click(screen.getByText("Test"));
    expect(screen.getByLabelText("Project title")).toBeInTheDocument();
  });

  it("uses muted styling for Untitled placeholder", () => {
    render(<InlineProjectTitle />);
    const button = screen.getByText("Untitled").closest("button")!;
    expect(button.className).toContain("text-neutral-500");
    expect(button.className).toContain("italic");
  });

  it("uses normal contrast for real project titles", () => {
    useChartStore.setState({ projectTitle: "My Plan" });
    render(<InlineProjectTitle />);
    const button = screen.getByText("My Plan").closest("button")!;
    expect(button.className).toContain("text-neutral-600");
    expect(button.className).not.toContain("italic");
  });

  it("strips extension only from end of filename", () => {
    useFileStore.setState({ fileName: "my.ownchart.backup.ownchart" });
    render(<InlineProjectTitle />);
    expect(screen.getByText("my.ownchart.backup")).toBeInTheDocument();
  });
});
