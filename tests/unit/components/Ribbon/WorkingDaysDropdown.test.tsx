import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkingDaysDropdown } from "../../../../src/components/Ribbon/WorkingDaysDropdown";
import { useChartStore } from "../../../../src/store/slices/chartSlice";
import { DEFAULT_WORKING_DAYS_CONFIG } from "../../../../src/config/workingDaysConfig";

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
      workingDaysConfig: { ...DEFAULT_WORKING_DAYS_CONFIG },
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

  it("toggles excludeSaturday and enables workingDaysMode", () => {
    useChartStore.setState({
      workingDaysConfig: {
        excludeSaturday: false,
        excludeSunday: false,
        excludeHolidays: false,
      },
      workingDaysMode: false,
    });
    render(<WorkingDaysDropdown />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    const saturdayCheckbox = screen.getByLabelText("Exclude Saturdays");
    fireEvent.click(saturdayCheckbox);

    const state = useChartStore.getState();
    expect(state.workingDaysConfig.excludeSaturday).toBe(true);
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

    const saturdayCheckbox = screen.getByLabelText("Exclude Saturdays");
    fireEvent.click(saturdayCheckbox);

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
});
