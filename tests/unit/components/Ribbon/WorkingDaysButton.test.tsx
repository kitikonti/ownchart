import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkingDaysButton } from "@/components/Ribbon/WorkingDaysButton";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";

vi.mock("@/services/holidayService", () => ({
  holidayService: {
    getAvailableCountries: (): { code: string; name: string }[] => [
      { code: "AT", name: "Austria" },
      { code: "DE", name: "Germany" },
      { code: "US", name: "United States" },
    ],
  },
}));

describe("WorkingDaysButton", () => {
  beforeEach(() => {
    useChartStore.setState({
      workingDaysConfig: {
        excludeSaturday: false,
        excludeSunday: false,
        excludeHolidays: false,
      },
      holidayRegion: "AT",
    });
    useTaskStore.setState({ tasks: [] });
  });

  it("renders trigger button with label", () => {
    render(<WorkingDaysButton />);
    expect(screen.getByTitle("Working Days configuration")).toBeInTheDocument();
  });

  it("opens dialog with checkboxes on click", () => {
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText("Exclude Saturdays")).toBeInTheDocument();
    expect(screen.getByText("Exclude Sundays")).toBeInTheDocument();
    expect(screen.getByText(/Exclude Holidays/)).toBeInTheDocument();
  });

  it("displays current country name for holidays", () => {
    useChartStore.setState({ holidayRegion: "DE" });
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText("Exclude Holidays (Germany)")).toBeInTheDocument();
  });

  it("falls back to region code when country not found", () => {
    useChartStore.setState({ holidayRegion: "XX" });
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText("Exclude Holidays (XX)")).toBeInTheDocument();
  });

  it("shows info text about working days behavior", () => {
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(
      screen.getByText(/Tasks skip non-working days/)
    ).toBeInTheDocument();
  });

  it("holidays checkbox aria-label includes country name", () => {
    useChartStore.setState({ holidayRegion: "DE" });
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(
      screen.getByLabelText("Exclude Holidays (Germany)")
    ).toBeInTheDocument();
  });

  it("hides recalc mode section when no tasks exist", () => {
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.queryByText(/Keep durations/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Keep task positions/)).not.toBeInTheDocument();
  });

  it("shows recalc mode section when tasks exist", () => {
    useTaskStore.setState({
      tasks: [
        {
          id: "t1",
          name: "Task 1",
          startDate: "2026-04-01",
          endDate: "2026-04-03",
          duration: 3,
          type: "task",
          progress: 0,
          level: 0,
          sortOrder: 0,
          manuallyScheduled: false,
        },
      ] as never[],
    });

    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    expect(screen.getByText(/Keep durations & lags/)).toBeInTheDocument();
    expect(screen.getByText(/Keep task positions/)).toBeInTheDocument();
  });

  it("applies config directly when no tasks and Apply is clicked", () => {
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    // Toggle Saturday
    fireEvent.click(screen.getByLabelText("Exclude Saturdays"));
    fireEvent.click(screen.getByText("Apply"));

    const state = useChartStore.getState();
    expect(state.workingDaysConfig.excludeSaturday).toBe(true);
  });

  it("cancel discards draft changes", () => {
    render(<WorkingDaysButton />);
    fireEvent.click(screen.getByTitle("Working Days configuration"));

    fireEvent.click(screen.getByLabelText("Exclude Saturdays"));
    fireEvent.click(screen.getByText("Cancel"));

    const state = useChartStore.getState();
    expect(state.workingDaysConfig.excludeSaturday).toBe(false);
  });
});
