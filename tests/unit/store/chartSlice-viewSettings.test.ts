/**
 * Unit tests for chartSlice view settings
 * Sprint 1.5.9: User Preferences & Settings
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useChartStore } from "../../../src/store/slices/chartSlice";

describe("Chart Store - View Settings", () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useChartStore.setState({
      showWeekends: true,
      showTodayMarker: true,
      showHolidays: true,
      showDependencies: true,
      showProgress: true,
      taskLabelPosition: "inside",
      workingDaysMode: false,
      workingDaysConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      },
      holidayRegion: "AT",
    });
  });

  describe("showWeekends", () => {
    it("should toggle showWeekends", () => {
      expect(useChartStore.getState().showWeekends).toBe(true);

      act(() => {
        useChartStore.getState().toggleWeekends();
      });
      expect(useChartStore.getState().showWeekends).toBe(false);

      act(() => {
        useChartStore.getState().toggleWeekends();
      });
      expect(useChartStore.getState().showWeekends).toBe(true);
    });

    it("should set showWeekends directly", () => {
      act(() => {
        useChartStore.getState().setShowWeekends(false);
      });
      expect(useChartStore.getState().showWeekends).toBe(false);

      act(() => {
        useChartStore.getState().setShowWeekends(true);
      });
      expect(useChartStore.getState().showWeekends).toBe(true);
    });
  });

  describe("showTodayMarker", () => {
    it("should toggle showTodayMarker", () => {
      expect(useChartStore.getState().showTodayMarker).toBe(true);

      act(() => {
        useChartStore.getState().toggleTodayMarker();
      });
      expect(useChartStore.getState().showTodayMarker).toBe(false);

      act(() => {
        useChartStore.getState().toggleTodayMarker();
      });
      expect(useChartStore.getState().showTodayMarker).toBe(true);
    });

    it("should set showTodayMarker directly", () => {
      act(() => {
        useChartStore.getState().setShowTodayMarker(false);
      });
      expect(useChartStore.getState().showTodayMarker).toBe(false);
    });
  });

  describe("showHolidays", () => {
    it("should toggle showHolidays", () => {
      expect(useChartStore.getState().showHolidays).toBe(true);

      act(() => {
        useChartStore.getState().toggleHolidays();
      });
      expect(useChartStore.getState().showHolidays).toBe(false);

      act(() => {
        useChartStore.getState().toggleHolidays();
      });
      expect(useChartStore.getState().showHolidays).toBe(true);
    });

    it("should set showHolidays directly", () => {
      act(() => {
        useChartStore.getState().setShowHolidays(false);
      });
      expect(useChartStore.getState().showHolidays).toBe(false);
    });
  });

  describe("showDependencies", () => {
    it("should toggle showDependencies", () => {
      expect(useChartStore.getState().showDependencies).toBe(true);

      act(() => {
        useChartStore.getState().toggleDependencies();
      });
      expect(useChartStore.getState().showDependencies).toBe(false);

      act(() => {
        useChartStore.getState().toggleDependencies();
      });
      expect(useChartStore.getState().showDependencies).toBe(true);
    });

    it("should set showDependencies directly", () => {
      act(() => {
        useChartStore.getState().setShowDependencies(false);
      });
      expect(useChartStore.getState().showDependencies).toBe(false);
    });
  });

  describe("showProgress", () => {
    it("should toggle showProgress", () => {
      expect(useChartStore.getState().showProgress).toBe(true);

      act(() => {
        useChartStore.getState().toggleProgress();
      });
      expect(useChartStore.getState().showProgress).toBe(false);

      act(() => {
        useChartStore.getState().toggleProgress();
      });
      expect(useChartStore.getState().showProgress).toBe(true);
    });

    it("should set showProgress directly", () => {
      act(() => {
        useChartStore.getState().setShowProgress(false);
      });
      expect(useChartStore.getState().showProgress).toBe(false);
    });
  });

  describe("taskLabelPosition", () => {
    it("should set taskLabelPosition to before", () => {
      act(() => {
        useChartStore.getState().setTaskLabelPosition("before");
      });
      expect(useChartStore.getState().taskLabelPosition).toBe("before");
    });

    it("should set taskLabelPosition to inside", () => {
      act(() => {
        useChartStore.getState().setTaskLabelPosition("inside");
      });
      expect(useChartStore.getState().taskLabelPosition).toBe("inside");
    });

    it("should set taskLabelPosition to after", () => {
      act(() => {
        useChartStore.getState().setTaskLabelPosition("after");
      });
      expect(useChartStore.getState().taskLabelPosition).toBe("after");
    });

    it("should set taskLabelPosition to none", () => {
      act(() => {
        useChartStore.getState().setTaskLabelPosition("none");
      });
      expect(useChartStore.getState().taskLabelPosition).toBe("none");
    });
  });

  describe("workingDaysMode", () => {
    it("should toggle workingDaysMode", () => {
      expect(useChartStore.getState().workingDaysMode).toBe(false);

      act(() => {
        useChartStore.getState().setWorkingDaysMode(true);
      });
      expect(useChartStore.getState().workingDaysMode).toBe(true);

      act(() => {
        useChartStore.getState().setWorkingDaysMode(false);
      });
      expect(useChartStore.getState().workingDaysMode).toBe(false);
    });
  });

  describe("workingDaysConfig", () => {
    it("should update excludeSaturday", () => {
      act(() => {
        useChartStore.getState().setWorkingDaysConfig({ excludeSaturday: false });
      });
      expect(useChartStore.getState().workingDaysConfig.excludeSaturday).toBe(
        false
      );
      // Other values should remain unchanged
      expect(useChartStore.getState().workingDaysConfig.excludeSunday).toBe(true);
      expect(useChartStore.getState().workingDaysConfig.excludeHolidays).toBe(
        true
      );
    });

    it("should update excludeSunday", () => {
      act(() => {
        useChartStore.getState().setWorkingDaysConfig({ excludeSunday: false });
      });
      expect(useChartStore.getState().workingDaysConfig.excludeSunday).toBe(
        false
      );
    });

    it("should update excludeHolidays", () => {
      act(() => {
        useChartStore.getState().setWorkingDaysConfig({ excludeHolidays: false });
      });
      expect(useChartStore.getState().workingDaysConfig.excludeHolidays).toBe(
        false
      );
    });

    it("should update multiple values at once", () => {
      act(() => {
        useChartStore.getState().setWorkingDaysConfig({
          excludeSaturday: false,
          excludeSunday: false,
        });
      });
      expect(useChartStore.getState().workingDaysConfig.excludeSaturday).toBe(
        false
      );
      expect(useChartStore.getState().workingDaysConfig.excludeSunday).toBe(
        false
      );
      expect(useChartStore.getState().workingDaysConfig.excludeHolidays).toBe(
        true
      );
    });
  });

  describe("holidayRegion", () => {
    it("should set holidayRegion", () => {
      act(() => {
        useChartStore.getState().setHolidayRegion("DE");
      });
      expect(useChartStore.getState().holidayRegion).toBe("DE");
    });

    it("should accept different country codes", () => {
      const countries = ["US", "GB", "FR", "CH", "AT"];

      countries.forEach((country) => {
        act(() => {
          useChartStore.getState().setHolidayRegion(country);
        });
        expect(useChartStore.getState().holidayRegion).toBe(country);
      });
    });
  });

  describe("setViewSettings", () => {
    it("should apply multiple view settings at once", () => {
      act(() => {
        useChartStore.getState().setViewSettings({
          showWeekends: false,
          showTodayMarker: false,
          showDependencies: false,
          taskLabelPosition: "after",
        });
      });

      const state = useChartStore.getState();
      expect(state.showWeekends).toBe(false);
      expect(state.showTodayMarker).toBe(false);
      expect(state.showDependencies).toBe(false);
      expect(state.taskLabelPosition).toBe("after");
      // Unchanged values should remain default
      expect(state.showHolidays).toBe(true);
      expect(state.showProgress).toBe(true);
    });

    it("should apply only provided settings", () => {
      act(() => {
        useChartStore.getState().setViewSettings({
          showHolidays: false,
        });
      });

      const state = useChartStore.getState();
      expect(state.showHolidays).toBe(false);
      // Everything else should be unchanged
      expect(state.showWeekends).toBe(true);
      expect(state.showTodayMarker).toBe(true);
      expect(state.showDependencies).toBe(true);
    });
  });

  describe("default values", () => {
    it("should have correct default values", () => {
      // Create a fresh store state
      useChartStore.setState({
        showWeekends: true,
        showTodayMarker: true,
        showHolidays: true,
        showDependencies: true,
        showProgress: true,
        taskLabelPosition: "inside",
        workingDaysMode: false,
        workingDaysConfig: {
          excludeSaturday: true,
          excludeSunday: true,
          excludeHolidays: true,
        },
      });

      const state = useChartStore.getState();

      expect(state.showWeekends).toBe(true);
      expect(state.showTodayMarker).toBe(true);
      expect(state.showHolidays).toBe(true);
      expect(state.showDependencies).toBe(true);
      expect(state.showProgress).toBe(true);
      expect(state.taskLabelPosition).toBe("inside");
      expect(state.workingDaysMode).toBe(false);
      expect(state.workingDaysConfig.excludeSaturday).toBe(true);
      expect(state.workingDaysConfig.excludeSunday).toBe(true);
      expect(state.workingDaysConfig.excludeHolidays).toBe(true);
    });
  });
});
