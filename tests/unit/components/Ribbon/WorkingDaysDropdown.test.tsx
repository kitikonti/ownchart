import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkingDaysDropdown } from "../../../../src/components/Ribbon/WorkingDaysDropdown";
import { useChartStore } from "../../../../src/store/slices/chartSlice";

vi.mock("../../../../src/services/holidayService", () => ({
  holidayService: {
    getAvailableCountries: (): { code: string; name: string }[] => [
      { code: "AT", name: "Austria" },
      { code: "DE", name: "Germany" },
      { code: "US", name: "United States" },
    ],
  },
}));

describe("WorkingDaysDropdown", () => {
  beforeEach(() => {
    useChartStore.setState({
      workingDaysConfig: {
        excludeSaturday: false,
        excludeSunday: false,
        excludeHolidays: false,
      },
      workingDaysMode: false,
      holidayRegion: "AT",
    });
  });

  it("renders trigger button with label", () => {
    render(<WorkingDaysDropdown />);
    expect(screen.getByTitle("Working Days configuration")).toBeInTheDocument();
  });

  it("opens dropdown panel on click", () => {
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText("Exclude Saturdays")).toBeInTheDocument();
    expect(screen.getByText("Exclude Sundays")).toBeInTheDocument();
    expect(screen.getByText(/Exclude Holidays/)).toBeInTheDocument();
  });

  it("displays current country name for holidays", () => {
    useChartStore.setState({ holidayRegion: "DE" });
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText("Exclude Holidays (Germany)")).toBeInTheDocument();
  });

  it("falls back to region code when country not found", () => {
    useChartStore.setState({ holidayRegion: "XX" });
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText("Exclude Holidays (XX)")).toBeInTheDocument();
  });

  it("toggles excludeSaturday and store auto-derives workingDaysMode", () => {
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    fireEvent.click(screen.getByLabelText("Exclude Saturdays"));

    const state = useChartStore.getState();
    expect(state.workingDaysConfig.excludeSaturday).toBe(true);
    // workingDaysMode is auto-derived by the store
    expect(state.workingDaysMode).toBe(true);
  });

  it("disables workingDaysMode when all exclusions are unchecked", () => {
    useChartStore.setState({
      workingDaysConfig: {
        excludeSaturday: true,
        excludeSunday: false,
        excludeHolidays: false,
      },
      workingDaysMode: true,
    });
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    fireEvent.click(screen.getByLabelText("Exclude Saturdays"));

    const state = useChartStore.getState();
    expect(state.workingDaysConfig.excludeSaturday).toBe(false);
    expect(state.workingDaysMode).toBe(false);
  });

  it("shows info text about working days behavior", () => {
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(
      screen.getByText(/Tasks skip non-working days/)
    ).toBeInTheDocument();
  });

  it("holidays checkbox aria-label includes country name", () => {
    useChartStore.setState({ holidayRegion: "DE" });
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(
      screen.getByLabelText("Exclude Holidays (Germany)")
    ).toBeInTheDocument();
  });

  it("dropdown panel has ARIA role and label", () => {
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    const panel = screen.getByRole("group", {
      name: "Working Days configuration",
    });
    expect(panel).toBeInTheDocument();
  });

  it("reads workingDaysMode from store for isActive indicator", () => {
    // When mode is derived as active, the trigger should reflect it
    useChartStore.setState({
      workingDaysConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      },
      workingDaysMode: true,
    });
    render(<WorkingDaysDropdown />);

    // The trigger button should have the active styling (border)
    const trigger = screen.getByTitle("Working Days configuration");
    expect(trigger.closest("button")).toHaveClass("dropdown-trigger-active");
  });
});
