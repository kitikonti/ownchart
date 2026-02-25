import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormatTabContent } from "../../../../src/components/Ribbon/FormatTabContent";
import { useChartStore } from "../../../../src/store/slices/chartSlice";
import { useUserPreferencesStore } from "../../../../src/store/slices/userPreferencesSlice";

describe("FormatTabContent", () => {
  beforeEach(() => {
    useChartStore.setState({ taskLabelPosition: "after" });
    useUserPreferencesStore.setState({
      preferences: {
        uiDensity: "normal",
        dateFormat: "DD/MM/YYYY",
        firstDayOfWeek: "monday",
        weekNumberingSystem: "iso",
      },
    });
  });

  it("renders all three toolbar groups", () => {
    render(<FormatTabContent />);

    expect(screen.getByTitle("Task Label Position")).toBeInTheDocument();
    expect(screen.getByTitle("First Day of Week")).toBeInTheDocument();
    expect(screen.getByTitle("UI Density")).toBeInTheDocument();
    expect(screen.getByTitle("Date Format")).toBeInTheDocument();
    expect(screen.getByTitle("Week Numbering System")).toBeInTheDocument();
  });

  it("renders WorkingDaysDropdown", () => {
    render(<FormatTabContent />);

    expect(
      screen.getByTitle("Working Days configuration")
    ).toBeInTheDocument();
  });

  it("updates taskLabelPosition via Labels dropdown", () => {
    render(<FormatTabContent />);

    fireEvent.click(screen.getByTitle("Task Label Position"));
    fireEvent.click(screen.getByText("Before"));

    expect(useChartStore.getState().taskLabelPosition).toBe("before");
  });

  it("updates uiDensity via Density dropdown", () => {
    render(<FormatTabContent />);

    fireEvent.click(screen.getByTitle("UI Density"));
    fireEvent.click(screen.getByText("Compact"));

    expect(useUserPreferencesStore.getState().preferences.uiDensity).toBe(
      "compact"
    );
  });

  it("updates dateFormat via Date Format dropdown", () => {
    render(<FormatTabContent />);

    fireEvent.click(screen.getByTitle("Date Format"));
    fireEvent.click(screen.getByText("YYYY-MM-DD"));

    expect(useUserPreferencesStore.getState().preferences.dateFormat).toBe(
      "YYYY-MM-DD"
    );
  });

  it("updates firstDayOfWeek via Week Start dropdown", () => {
    render(<FormatTabContent />);

    fireEvent.click(screen.getByTitle("First Day of Week"));
    fireEvent.click(screen.getByText("Sunday"));

    expect(useUserPreferencesStore.getState().preferences.firstDayOfWeek).toBe(
      "sunday"
    );
  });

  it("updates weekNumberingSystem via Week dropdown", () => {
    render(<FormatTabContent />);

    fireEvent.click(screen.getByTitle("Week Numbering System"));
    fireEvent.click(screen.getByText("US Standard"));

    expect(
      useUserPreferencesStore.getState().preferences.weekNumberingSystem
    ).toBe("us");
  });
});
